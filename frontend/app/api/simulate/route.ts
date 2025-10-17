import { NextResponse } from "next/server";

/**
 * Input JSON:
 * {
 *   portfolio: [{ ticker: string, qty: number, price: number }],
 *   cash: number,
 *   targets?: Record<string, number>, // optional % targets like { AAPL: 0.20, TSLA: 0.22, SPY: 0.35, MSFT: 0.23 }
 *   settings?: { minTradeValue?: number, txCostBps?: number }
 * }
 */

type Pos = { ticker: string; qty: number; price: number };

export async function POST(req: Request) {
  const body = await req.json();
  const portfolio: Pos[] = (body?.portfolio ?? []).map((p: any) => ({
    ticker: String(p.ticker || "").toUpperCase(),
    qty: Number(p.qty || 0),
    price: Number(p.price || 0),
  }));
  let cash = Number(body?.cash ?? 0);

  // Default targets (can be overridden by client)
  const targets: Record<string, number> =
    body?.targets ?? { AAPL: 0.20, TSLA: 0.22, SPY: 0.35, MSFT: 0.23 };

  const minTradeValue = Number(body?.settings?.minTradeValue ?? 200); // USD
  const txCostBps = Number(body?.settings?.txCostBps ?? 2); // basis points

  const currentValue = (p: Pos) => p.qty * p.price;
  const equityValue = portfolio.reduce((s, p) => s + currentValue(p), 0);
  const totalValue = equityValue + cash;

  // Current weights
  const weights: Record<string, number> = {};
  for (const p of portfolio) {
    weights[p.ticker] = equityValue > 0 ? currentValue(p) / equityValue : 0;
  }

  // Compute target $ amounts
  const targetDollars: Record<string, number> = {};
  for (const [tkr, tgtPct] of Object.entries(targets)) {
    targetDollars[tkr] = tgtPct * totalValue;
  }

  // Normalize: include any tickers not in targets by assigning 0 target
  for (const p of portfolio) {
    if (!(p.ticker in targetDollars)) targetDollars[p.ticker] = 0;
    if (!(p.ticker in targets)) targets[p.ticker] = 0;
  }

  // Ideal qty at current prices
  const idealQty: Record<string, number> = {};
  for (const [tkr, dollars] of Object.entries(targetDollars)) {
    // floor to whole shares
    const price = portfolio.find((p) => p.ticker === tkr)?.price ?? 0;
    idealQty[tkr] = price > 0 ? Math.floor(dollars / price) : 0;
  }

  // Proposed trades
  type Trade = { ticker: string; side: "BUY" | "SELL"; qty: number; estValue: number };
  const trades: Trade[] = [];

  // Build a map for quick lookups
  const byTicker: Record<string, Pos> = {};
  for (const p of portfolio) byTicker[p.ticker] = p;

  // First pass: compute raw deltas
  for (const [tkr, tgtQty] of Object.entries(idealQty)) {
    const curQty = byTicker[tkr]?.qty ?? 0;
    const price = byTicker[tkr]?.price ?? 0;
    const deltaQty = tgtQty - curQty;
    const absValue = Math.abs(deltaQty * price);

    if (price <= 0) continue;
    if (absValue < minTradeValue) continue; // respect min trade value

    if (deltaQty > 0) {
      // BUY
      trades.push({ ticker: tkr, side: "BUY", qty: deltaQty, estValue: deltaQty * price });
    } else if (deltaQty < 0) {
      // SELL
      trades.push({ ticker: tkr, side: "SELL", qty: Math.abs(deltaQty), estValue: Math.abs(deltaQty * price) });
    }
  }

  // Apply trades virtually to compute new state + cash with tx costs
  let newPortfolio: Pos[] = JSON.parse(JSON.stringify(portfolio));
  let newCash = cash;

  for (const tr of trades) {
    const px = byTicker[tr.ticker]?.price ?? 0;
    const gross = tr.qty * px;
    const fee = (txCostBps / 10000) * gross;
    if (tr.side === "BUY") {
      // require cash
      if (newCash >= gross + fee) {
        const p = newPortfolio.find((x) => x.ticker === tr.ticker);
        if (p) p.qty += tr.qty;
        else newPortfolio.push({ ticker: tr.ticker, qty: tr.qty, price: px });
        newCash -= (gross + fee);
      }
    } else {
      // SELL
      const p = newPortfolio.find((x) => x.ticker === tr.ticker);
      if (p) {
        const sellQty = Math.min(p.qty, tr.qty);
        p.qty -= sellQty;
        newCash += sellQty * px - fee;
      }
    }
  }

  const newEquity = newPortfolio.reduce((s, p) => s + p.qty * p.price, 0);
  const newTotal = newEquity + newCash;

  // Drift summary vs targets after proposed trades
  const newWeights: Record<string, number> = {};
  for (const p of newPortfolio) {
    newWeights[p.ticker] = newEquity > 0 ? (p.qty * p.price) / newEquity : 0;
  }
  for (const k of Object.keys(targets)) {
    if (!(k in newWeights)) newWeights[k] = 0;
  }

  const driftItems = Object.entries(targets).map(([tkr, tgt]) => {
    const cur = weights[tkr] ?? 0;
    const nxt = newWeights[tkr] ?? 0;
    return {
      ticker: tkr,
      current_pct: +(cur * 100).toFixed(2),
      next_pct: +(nxt * 100).toFixed(2),
      target_pct: +(tgt * 100).toFixed(2),
      // distance from target post-trade
      residual_pct: +((nxt - tgt) * 100).toFixed(2),
    };
  });

  const overallDriftPct = driftItems
    .reduce((s, d) => s + Math.abs((d.next_pct - d.target_pct)), 0) / driftItems.length;

  return NextResponse.json({
    status: "ok",
    inputs: { portfolio, cash, targets, settings: { minTradeValue, txCostBps } },
    summary: {
      equityValue: +equityValue.toFixed(2),
      totalValue: +totalValue.toFixed(2),
      newEquity: +newEquity.toFixed(2),
      newTotal: +newTotal.toFixed(2),
      cashStart: +cash.toFixed(2),
      cashEnd: +newCash.toFixed(2),
      overallDriftPct: +overallDriftPct.toFixed(2),
    },
    trades,
    newPortfolio,
    drift: driftItems,
  });
}