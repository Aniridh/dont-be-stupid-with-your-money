'use client';

import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock, AlertCircle, RefreshCw } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
}

interface NewsFeedProps {
  selectedTicker?: string;
  isLiveMode?: boolean;
}

export default function NewsFeed({ selectedTicker, isLiveMode = false }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNews = async (ticker?: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = ticker ? `/api/news?ticker=${ticker}` : '/api/news';
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setNews(data.news || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch news');
      console.error('News fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(selectedTicker);
  }, [selectedTicker]);

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-100';
      case 'negative':
        return 'text-red-600 bg-red-100';
      case 'neutral':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return '📈';
      case 'negative':
        return '📉';
      case 'neutral':
        return '➡️';
      default:
        return '📰';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Market News</h2>
        <div className="flex items-center space-x-2">
          {isLiveMode ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              LIVE
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              STUB
            </span>
          )}
          <button
            onClick={() => fetchNews(selectedTicker)}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {selectedTicker && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Newspaper className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              News for {selectedTicker}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {loading && news.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading news...</p>
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-8">
          <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No news available</p>
          <p className="text-sm text-gray-400 mt-2">
            {selectedTicker ? `Try selecting a different ticker` : 'News will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {news.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    {truncateText(item.title, 80)}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{item.source}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(item.publishedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  {item.sentiment && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(item.sentiment)}`}>
                      <span className="mr-1">{getSentimentIcon(item.sentiment)}</span>
                      {item.sentiment}
                    </span>
                  )}
                  {item.relevanceScore && (
                    <span className="text-xs text-gray-500">
                      {(item.relevanceScore * 100).toFixed(0)}% relevant
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs"
                >
                  <span>Read more</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {lastUpdated && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            <span>{news.length} articles</span>
          </div>
        </div>
      )}
    </div>
  );
}
