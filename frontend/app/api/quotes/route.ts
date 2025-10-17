import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');

  try {
    if (!symbols) {
      return NextResponse.json(
        { error: 'Symbols parameter is required' },
        { status: 400 }
      );
    }

    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
    
    // In STUB_MODE, return demo quote data
    const demoQuotes = symbolList.map(symbol => ({
      symbol,
      price: Math.random() * 500 + 50, // Random price between 50-550
      change: (Math.random() - 0.5) * 20, // Random change between -10 to +10
      changePercent: (Math.random() - 0.5) * 10, // Random change % between -5% to +5%
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      marketCap: Math.floor(Math.random() * 1000000000000) + 100000000000,
      timestamp: new Date().toISOString()
    }));

    return NextResponse.json({
      quotes: demoQuotes,
      symbols: symbolList,
      source: 'stub',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Quotes API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch quotes',
        quotes: [],
        symbols: symbols ? symbols.split(',').map(s => s.trim().toUpperCase()) : [],
        source: 'stub',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
