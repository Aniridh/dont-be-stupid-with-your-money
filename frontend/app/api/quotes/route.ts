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
    
    // Call backend MCP server for real quotes
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/mcp/tools/get_quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbols: symbolList
      })
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'Backend error');
    }

    return NextResponse.json({
      quotes: data.data.quotes,
      symbols: symbolList,
      source: 'live',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Quotes API error:', error);
    
    // Fallback to realistic demo data if backend fails
    const fallbackQuotes = symbolList.map(symbol => {
      const prices: Record<string, number> = {
        'TSLA': 180.50,
        'AAPL': 175.43,
        'SPY': 445.20,
        'MSFT': 385.75,
        'NVDA': 450.25,
        'GOOGL': 142.80,
        'AMZN': 155.30,
        'META': 350.15,
        'QQQ': 380.90,
        'IWM': 200.45
      };
      
      const price = prices[symbol] || 100.00;
      
      return {
        symbol,
        price,
        change: 0,
        changePercent: 0,
        volume: 1000000,
        timestamp: new Date().toISOString()
      };
    });

    return NextResponse.json({
      quotes: fallbackQuotes,
      symbols: symbolList,
      source: 'fallback',
      timestamp: new Date().toISOString()
    });
  }
}
