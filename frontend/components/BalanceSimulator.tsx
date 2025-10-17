"use client";
import { useMemo, useState } from "react";

type Pos = { ticker: string; qty: number; price: number };

export default function BalanceSimulator({ initialPortfolio }: { initialPortfolio: Pos[] }) {
  const [portfolio, setPortfolio] = useState<Pos[]>(
    (initialPortfolio || []).map(p => ({ ticker: p.ticker, qty: Number(p.qty||0), price: Number(p.price||0) }))
  );
  const [cash, setCash] = useState<number>(10000);
  const [plan, setPlan] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  const originalValue = useMemo(() => {
    return (initialPortfolio||[]).reduce((s, p) => s + p.qty * p.price, 0) + 10000;
  }, [initialPortfolio]);

  const totalValue = useMemo(() => {
    return portfolio.reduce((s, p) => s + (Number(p.qty)||0) * (Number(p.price)||0), 0) + (Number(cash)||0);
  }, [portfolio, cash]);

  const deltaAbs = +(totalValue - originalValue).toFixed(2);
  const deltaPct = +((totalValue - originalValue) / (originalValue || 1) * 100).toFixed(2);

  const setQty = (tkr: string, v: string) => {
    const n = Number(v || 0);
    setPortfolio(prev => prev.map(p => p.ticker === tkr ? { ...p, qty: isFinite(n)? n : 0 } : p));
  };
  const setPrice = (tkr: string, v: string) => {
    const n = Number(v || 0);
    setPortfolio(prev => prev.map(p => p.ticker === tkr ? { ...p, price: isFinite(n)? n : 0 } : p));
  };

  const addPosition = () => {
    const next = prompt("Add ticker (e.g., NVDA):");
    if (!next) return;
    if (portfolio.find(p => p.ticker.toUpperCase() === next.toUpperCase())) return;
    setPortfolio(prev => [...prev, { ticker: next.toUpperCase(), qty: 0, price: 0 }]);
  };

  const removePosition = (tkr: string) => {
    setPortfolio(prev => prev.filter(p => p.ticker !== tkr));
  };

  const simulateRebalance = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio, cash }),
      });
      const data = await res.json();
      setPlan(data);
    } catch (e) {
      console.error(e);
      alert("Simulation failed. Check backend logs.");
    } finally {
      setBusy(false);
    }
  };

  const resetAll = () => {
    setPortfolio((initialPortfolio||[]).map(p => ({...p})));
    setCash(10000);
    setPlan(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">💰 Balance Simulator</h3>
        <span className="text-xs text-green-600">Live Mode ●</span>
      </div>

      {/* Cash */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-sm font-medium">Cash Balance</div>
        <input
          type="number"
          className="border rounded p-2 w-40 text-right"
          value={cash}
          onChange={(e) => setCash(Number(e.target.value || 0))}
        />
      </div>

      {/* Positions */}
      <div className="flex items-center justify-between">
        <div className="font-medium">Portfolio Positions</div>
        <button onClick={addPosition} className="text-sm bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">
          + Add Position
        </button>
      </div>

      <table className="w-full text-sm mt-2">
        <thead>
          <tr className="text-left text-gray-500">
            <th>Ticker</th><th>Quantity</th><th>Price ($)</th><th>Value ($)</th><th></th>
          </tr>
        </thead>
        <tbody>
          {portfolio.map(p => (
            <tr key={p.ticker} className="border-t">
              <td className="py-2">{p.ticker}</td>
              <td>
                <input type="number" className="border rounded p-1 w-24 text-right"
                  value={p.qty}
                  onChange={(e)=>setQty(p.ticker, e.target.value)}
                />
              </td>
              <td>
                <input type="number" className="border rounded p-1 w-24 text-right"
                  value={p.price}
                  onChange={(e)=>setPrice(p.ticker, e.target.value)}
                />
              </td>
              <td>${(Number(p.qty||0)*Number(p.price||0)).toFixed(2)}</td>
              <td>
                <button onClick={()=>removePosition(p.ticker)} className="text-xs text-red-600 hover:underline">Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-gray-50 rounded p-3">
          <div className="text-xs text-gray-500">Total Portfolio Value</div>
          <div className="text-2xl font-semibold">${totalValue.toLocaleString()}</div>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <div className="text-xs text-gray-500">Change from Original</div>
          <div className={`text-2xl font-semibold ${deltaAbs>=0 ? "text-green-600" : "text-red-600"}`}>
            {deltaAbs>=0 ? "+" : ""}${Math.abs(deltaAbs).toLocaleString()} ({deltaPct>=0?"+":""}{deltaPct}%)
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button onClick={simulateRebalance} disabled={busy}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {busy ? "Simulating..." : "Simulate Rebalance"}
        </button>
        <button onClick={resetAll} className="border px-4 py-2 rounded">Reset</button>
      </div>

      {/* Trade Plan */}
      {plan?.status === "ok" && (
        <div className="mt-5 space-y-3">
          <div className="text-sm text-gray-600">
            Drift after trades: <span className="font-medium">{plan.summary.overallDriftPct}%</span> |
            New Total: <span className="font-medium">${plan.summary.newTotal.toLocaleString()}</span> |
            Cash: <span className="font-medium">${plan.summary.cashEnd.toLocaleString()}</span>
          </div>

          <div className="bg-gray-50 rounded p-3">
            <div className="font-medium mb-2">Suggested Trades</div>
            {plan.trades.length === 0 ? (
              <div className="text-sm text-gray-500">No trades needed above min trade value.</div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500"><th>Ticker</th><th>Side</th><th>Qty</th><th>Est. Value</th></tr></thead>
                <tbody>
                  {plan.trades.map((t:any, idx:number)=>(
                    <tr key={idx} className="border-t">
                      <td>{t.ticker}</td>
                      <td className={t.side==="BUY" ? "text-green-700" : "text-red-700"}>{t.side}</td>
                      <td>{t.qty}</td>
                      <td>${Number(t.estValue||0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-gray-50 rounded p-3">
            <div className="font-medium mb-2">Weights vs Targets (Post-Trade)</div>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500"><th>Ticker</th><th>Current %</th><th>Next %</th><th>Target %</th><th>Residual %</th></tr></thead>
              <tbody>
                {plan.drift.map((d:any, idx:number)=>(
                  <tr key={idx} className="border-t">
                    <td>{d.ticker}</td>
                    <td>{d.current_pct}%</td>
                    <td>{d.next_pct}%</td>
                    <td>{d.target_pct}%</td>
                    <td className={Math.abs(d.residual_pct)>1 ? "text-amber-700" : "text-gray-700"}>
                      {d.residual_pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}