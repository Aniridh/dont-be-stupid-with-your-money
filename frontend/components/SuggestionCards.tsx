'use client';

import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Suggestion {
  symbol: string;
  action: string;
  current_weight: number;
  suggested_weight: number;
  reasoning: string;
  confidence: number;
  risk_level: string;
  source_refs: string[];
  meta?: {
    provider?: string;
  };
}

interface SuggestionCardsProps {
  suggestions: Suggestion[];
  onSourceRefClick: (sourceRef: string) => void;
}

export default function SuggestionCards({ suggestions, onSourceRefClick }: SuggestionCardsProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy':
      case 'consider_buy':
      case 'increase_position':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'sell':
      case 'reduce_position':
      case 'consider_sell':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'hold':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getProviderBadge = (provider?: string) => {
    if (!provider) return null;
    
    const isStub = provider.endsWith('stub') || provider.endsWith('stub_fallback');
    const isLive = ['google', 'yahoo', 'apify', 'truefoundry'].includes(provider);
    
    if (isStub) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          STUB
        </span>
      );
    }
    
    if (isLive) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          {provider.toUpperCase()}
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        {provider.toUpperCase()}
      </span>
    );
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy':
      case 'consider_buy':
      case 'increase_position':
        return 'border-green-200 bg-green-50';
      case 'sell':
      case 'reduce_position':
      case 'consider_sell':
        return 'border-red-200 bg-red-50';
      case 'hold':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'chip-success';
      case 'medium':
        return 'chip-warning';
      case 'high':
        return 'chip-danger';
      default:
        return 'chip-gray';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Trading Suggestions</h2>
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <p className="text-gray-500">No suggestions at this time</p>
          <p className="text-sm text-gray-400 mt-2">Portfolio is well-balanced</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Trading Suggestions</h2>
      
      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${getActionColor(suggestion.action)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getActionIcon(suggestion.action)}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{suggestion.symbol}</h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {suggestion.action.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                  {(suggestion.confidence * 100).toFixed(0)}% confidence
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`chip ${getRiskColor(suggestion.risk_level)}`}>
                    {suggestion.risk_level} risk
                  </span>
                  {getProviderBadge(suggestion.meta?.provider)}
                </div>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-sm text-gray-700">{suggestion.reasoning}</p>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="text-gray-500">Current weight:</span>
                  <span className="ml-1 font-medium">{(suggestion.current_weight * 100).toFixed(1)}%</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Suggested:</span>
                  <span className="ml-1 font-medium">{(suggestion.suggested_weight * 100).toFixed(1)}%</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Change:</span>
                  <span className={`ml-1 font-medium ${
                    suggestion.suggested_weight > suggestion.current_weight ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {suggestion.suggested_weight > suggestion.current_weight ? '+' : ''}
                    {((suggestion.suggested_weight - suggestion.current_weight) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {suggestion.source_refs.map((ref, refIndex) => (
                  <button
                    key={refIndex}
                    onClick={() => onSourceRefClick(ref)}
                    className="chip chip-primary"
                  >
                    {ref}
                  </button>
                ))}
              </div>
              <div className="flex space-x-2">
                <button className="btn btn-outline text-xs px-3 py-1">
                  Simulate
                </button>
                <button className="btn btn-primary text-xs px-3 py-1">
                  Execute
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
