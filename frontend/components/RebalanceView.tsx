'use client';

import { RefreshCw, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface Rebalance {
  total_value: number;
  target_allocation: Record<string, number>;
  current_allocation: Record<string, number>;
  drift: number;
  rebalance_needed: boolean;
  source_refs: string[];
}

interface RebalanceViewProps {
  rebalance: Rebalance;
  onSourceRefClick: (sourceRef: string) => void;
}

export default function RebalanceView({ rebalance, onSourceRefClick }: RebalanceViewProps) {
  const getDriftColor = (drift: number) => {
    if (drift <= 0.02) return 'text-green-600';
    if (drift <= 0.05) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDriftIcon = (drift: number) => {
    if (drift <= 0.02) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (drift <= 0.05) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getDriftStatus = (drift: number) => {
    if (drift <= 0.02) return 'Well Balanced';
    if (drift <= 0.05) return 'Minor Drift';
    return 'Rebalance Needed';
  };

  const symbols = Object.keys(rebalance.target_allocation);
  const allocationData = symbols.map(symbol => ({
    symbol,
    current: rebalance.current_allocation[symbol] || 0,
    target: rebalance.target_allocation[symbol],
    difference: (rebalance.current_allocation[symbol] || 0) - rebalance.target_allocation[symbol]
  }));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Portfolio Rebalance</h2>
        <div className="flex items-center space-x-2">
          {getDriftIcon(rebalance.drift)}
          <span className={`text-sm font-medium ${getDriftColor(rebalance.drift)}`}>
            {getDriftStatus(rebalance.drift)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="metric-card">
          <div className="text-sm font-medium text-gray-500">Total Value</div>
          <div className="text-lg font-bold text-gray-900">
            ${rebalance.total_value.toLocaleString()}
          </div>
        </div>
        <div className="metric-card">
          <div className="text-sm font-medium text-gray-500">Drift</div>
          <div className={`text-lg font-bold ${getDriftColor(rebalance.drift)}`}>
            {(rebalance.drift * 100).toFixed(2)}%
          </div>
        </div>
        <div className="metric-card">
          <div className="text-sm font-medium text-gray-500">Status</div>
          <div className="text-lg font-bold text-gray-900">
            {rebalance.rebalance_needed ? 'Action Required' : 'Balanced'}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Allocation Comparison</h3>
        
        <div className="space-y-3">
          {allocationData.map((item) => (
            <div key={item.symbol} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{item.symbol}</span>
                <div className="flex items-center space-x-2">
                  {item.difference > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : item.difference < 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    item.difference > 0 ? 'text-red-600' : 
                    item.difference < 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {item.difference > 0 ? '+' : ''}{(item.difference * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Current</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${item.current * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    {(item.current * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Target</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${item.target * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    {(item.target * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-1">
            {rebalance.source_refs.map((ref, refIndex) => (
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
            <button className="btn btn-outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Simulate Rebalance
            </button>
            {rebalance.rebalance_needed && (
              <button className="btn btn-primary">
                Execute Rebalance
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
