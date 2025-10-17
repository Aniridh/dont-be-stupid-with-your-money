import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  try {
    // In STUB_MODE, return demo agent insights
    const demoInsights = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        symbol: ticker || 'AAPL',
        type: 'risk_assessment' as const,
        message: `FinSage Agent thinks ${ticker || 'AAPL'} risk is rising due to sentiment shift. Suggested trim: -3%.`,
        confidence: 0.85,
        action: 'reduce_position',
        impact: 'medium' as const,
        source: 'finsage_agent' as const
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        symbol: ticker || 'TSLA',
        type: 'technical_signal' as const,
        message: `Technical analysis shows ${ticker || 'TSLA'} approaching oversold levels. RSI at 28.`,
        confidence: 0.72,
        action: 'consider_buy',
        impact: 'high' as const,
        source: 'truefoundry' as const
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        type: 'portfolio_advice' as const,
        message: 'Portfolio drift analysis complete. Current allocation drift: 5.2%. Consider rebalancing.',
        confidence: 0.90,
        action: 'rebalance',
        impact: 'medium' as const,
        source: 'airia' as const
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        symbol: ticker || 'SPY',
        type: 'sentiment_analysis' as const,
        message: `Sentiment analysis for ${ticker || 'SPY'} shows positive momentum. News sentiment score: 0.75.`,
        confidence: 0.68,
        action: 'hold',
        impact: 'low' as const,
        source: 'finsage_agent' as const
      }
    ];

    return NextResponse.json({
      insights: demoInsights,
      ticker: ticker || 'general',
      source: 'stub',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Agent insights API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch agent insights',
        insights: [],
        ticker: ticker || 'general',
        source: 'stub',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
