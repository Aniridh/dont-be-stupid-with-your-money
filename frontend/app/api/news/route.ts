import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  try {
    // In STUB_MODE, return demo news data
    const demoNews = [
      {
        id: '1',
        title: `${ticker || 'Market'} shows strong momentum as earnings season approaches`,
        url: 'https://example.com/news/1',
        publishedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        source: 'Financial Times',
        sentiment: 'positive' as const,
        relevanceScore: 0.85
      },
      {
        id: '2',
        title: `Analysts raise price targets for ${ticker || 'major tech stocks'} following Q3 results`,
        url: 'https://example.com/news/2',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: 'Reuters',
        sentiment: 'positive' as const,
        relevanceScore: 0.72
      },
      {
        id: '3',
        title: `${ticker || 'Market'} volatility increases amid geopolitical concerns`,
        url: 'https://example.com/news/3',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: 'Bloomberg',
        sentiment: 'negative' as const,
        relevanceScore: 0.68
      },
      {
        id: '4',
        title: `Fed signals continued rate stability, ${ticker || 'markets'} respond positively`,
        url: 'https://example.com/news/4',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: 'Wall Street Journal',
        sentiment: 'neutral' as const,
        relevanceScore: 0.55
      }
    ];

    return NextResponse.json({
      news: demoNews,
      ticker: ticker || 'general',
      source: 'stub',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch news',
        news: [],
        ticker: ticker || 'general',
        source: 'stub',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
