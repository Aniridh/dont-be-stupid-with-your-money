'use client';

import { AlertTriangle, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface Signal {
  symbol: string;
  type: string;
  signal: string;
  confidence: number;
  description: string;
  value: number;
  threshold: number;
  source_refs: string[];
  meta?: {
    provider?: string;
  };
}

interface SignalTableProps {
  signals: Signal[];
  onSourceRefClick: (sourceRef: string) => void;
}

export default function SignalTable({ signals, onSourceRefClick }: SignalTableProps) {
  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'valuation':
        return <TrendingUp className="h-4 w-4" />;
      case 'technical':
        return <Activity className="h-4 w-4" />;
      case 'momentum':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
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

  const getSignalColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-red-600 bg-red-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getSignalTypeColor = (type: string) => {
    switch (type) {
      case 'valuation':
        return 'chip-danger';
      case 'technical':
        return 'chip-warning';
      case 'momentum':
        return 'chip-success';
      default:
        return 'chip-gray';
    }
  };

  if (signals.length === 0) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Market Signals</h2>
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No signals detected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Market Signals</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value vs Threshold</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sources</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {signals.map((signal, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getSignalIcon(signal.type)}
                    <span className="ml-2 text-sm font-medium text-gray-900">{signal.symbol}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`chip ${getSignalTypeColor(signal.type)}`}>
                    {signal.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{signal.signal}</div>
                  <div className="text-xs text-gray-500">{signal.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className={`h-2 rounded-full ${getSignalColor(signal.confidence).split(' ')[0].replace('text-', 'bg-')}`}
                        style={{ width: `${signal.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900">{(signal.confidence * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {signal.value.toFixed(2)} / {signal.threshold.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {signal.value > signal.threshold ? 'Above threshold' : 'Below threshold'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getProviderBadge(signal.meta?.provider)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {signal.source_refs.map((ref, refIndex) => (
                      <button
                        key={refIndex}
                        onClick={() => onSourceRefClick(ref)}
                        className="chip chip-primary"
                      >
                        {ref}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
