'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Clock, RefreshCw, Zap } from 'lucide-react';

interface AgentInsight {
  id: string;
  timestamp: string;
  symbol?: string;
  type: 'risk_assessment' | 'sentiment_analysis' | 'technical_signal' | 'portfolio_advice';
  message: string;
  confidence: number;
  action?: string;
  impact?: 'low' | 'medium' | 'high';
  source: 'airia' | 'truefoundry' | 'finsage_agent';
}

interface AgentInsightPanelProps {
  selectedTicker?: string;
  isLiveMode?: boolean;
}

export default function AgentInsightPanel({ selectedTicker, isLiveMode = false }: AgentInsightPanelProps) {
  const [insights, setInsights] = useState<AgentInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchInsights = async (ticker?: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = ticker ? `/api/agent/insights?ticker=${ticker}` : '/api/agent/insights';
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setInsights(data.insights || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch agent insights');
      console.error('Insights fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights(selectedTicker);
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchInsights(selectedTicker);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedTicker]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'risk_assessment':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'sentiment_analysis':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'technical_signal':
        return <TrendingDown className="h-4 w-4 text-purple-500" />;
      case 'portfolio_advice':
        return <Brain className="h-4 w-4 text-green-500" />;
      default:
        return <Zap className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'risk_assessment':
        return 'border-red-200 bg-red-50';
      case 'sentiment_analysis':
        return 'border-blue-200 bg-blue-50';
      case 'technical_signal':
        return 'border-purple-200 bg-purple-50';
      case 'portfolio_advice':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSourceBadge = (source: string) => {
    const sourceColors = {
      'airia': 'bg-blue-100 text-blue-700',
      'truefoundry': 'bg-purple-100 text-purple-700',
      'finsage_agent': 'bg-green-100 text-green-700'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${sourceColors[source as keyof typeof sourceColors] || 'bg-gray-100 text-gray-700'}`}>
        {source.toUpperCase()}
      </span>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) return `${diffMins}m ago`;
    return `${diffHours}h ago`;
  };

  const filteredInsights = selectedTicker 
    ? insights.filter(insight => !insight.symbol || insight.symbol === selectedTicker)
    : insights;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">AI Agent Insights</h2>
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
            onClick={() => fetchInsights(selectedTicker)}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {selectedTicker && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Brain className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              Insights for {selectedTicker}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {loading && insights.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading AI insights...</p>
        </div>
      ) : filteredInsights.length === 0 ? (
        <div className="text-center py-8">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No AI insights available</p>
          <p className="text-sm text-gray-400 mt-2">
            {selectedTicker ? `Try selecting a different ticker` : 'AI insights will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredInsights.map((insight) => (
            <div
              key={insight.id}
              className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getInsightIcon(insight.type)}
                  <span className="text-sm font-medium text-gray-900">
                    {insight.type.replace('_', ' ').toUpperCase()}
                  </span>
                  {insight.symbol && (
                    <span className="text-sm font-mono text-gray-600">
                      {insight.symbol}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {insight.impact && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}>
                      {insight.impact} impact
                    </span>
                  )}
                  {getSourceBadge(insight.source)}
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-700">{insight.message}</p>
                {insight.action && (
                  <div className="mt-2 p-2 bg-white border border-gray-200 rounded text-xs text-gray-600">
                    <strong>Action:</strong> {insight.action}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${insight.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {(insight.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimeAgo(insight.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {lastUpdated && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            <span>{filteredInsights.length} insights</span>
          </div>
        </div>
      )}
    </div>
  );
}
