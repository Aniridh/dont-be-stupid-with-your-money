'use client';

import { useState } from 'react';
import { Sliders, TrendingUp, TrendingDown, RefreshCw, Calculator, Target, AlertCircle } from 'lucide-react';

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  adjustments: Record<string, number>;
}

interface SimulationPanelProps {
  currentAllocation: Record<string, number>;
  totalValue: number;
  onSimulate: (scenario: string, adjustments: Record<string, number>) => void;
  isLiveMode?: boolean;
}

export default function SimulationPanel({ 
  currentAllocation, 
  totalValue, 
  onSimulate,
  isLiveMode = false 
}: SimulationPanelProps) {
  const [selectedScenario, setSelectedScenario] = useState<string>('drift');
  const [customAdjustments, setCustomAdjustments] = useState<Record<string, number>>({});
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const scenarios: SimulationScenario[] = [
    {
      id: 'drift',
      name: 'Rebalance Drift',
      description: 'Adjust portfolio to target allocation',
      adjustments: {}
    },
    {
      id: 'conservative',
      name: 'Conservative Shift',
      description: 'Reduce risk by increasing bond allocation',
      adjustments: { 'SPY': -0.1, 'BND': 0.1 }
    },
    {
      id: 'aggressive',
      name: 'Aggressive Growth',
      description: 'Increase growth stock allocation',
      adjustments: { 'AAPL': 0.05, 'TSLA': 0.05, 'SPY': -0.1 }
    },
    {
      id: 'cash_increase',
      name: 'Increase Cash',
      description: 'Reduce all positions by 10% for cash',
      adjustments: Object.keys(currentAllocation).reduce((acc, key) => {
        acc[key] = -0.1;
        return acc;
      }, {} as Record<string, number>)
    }
  ];

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setCustomAdjustments(scenario.adjustments);
    }
  };

  const handleAdjustmentChange = (symbol: string, value: number) => {
    setCustomAdjustments(prev => ({
      ...prev,
      [symbol]: value
    }));
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const result = await onSimulate(selectedScenario, customAdjustments);
      setSimulationResult(result);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const resetSimulation = () => {
    setCustomAdjustments({});
    setSimulationResult(null);
    setSelectedScenario('drift');
  };

  const calculateNewAllocation = () => {
    const newAllocation: Record<string, number> = {};
    Object.keys(currentAllocation).forEach(symbol => {
      const current = currentAllocation[symbol];
      const adjustment = customAdjustments[symbol] || 0;
      newAllocation[symbol] = Math.max(0, Math.min(1, current + adjustment));
    });
    return newAllocation;
  };

  const newAllocation = calculateNewAllocation();
  const totalAdjustment = Object.values(customAdjustments).reduce((sum, adj) => sum + adj, 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Portfolio Simulation</h2>
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
        </div>
      </div>

      {/* Scenario Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Simulation Scenarios</h3>
        <div className="grid grid-cols-2 gap-2">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => handleScenarioChange(scenario.id)}
              className={`p-3 text-left border rounded-lg transition-colors ${
                selectedScenario === scenario.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium text-gray-900">{scenario.name}</div>
              <div className="text-xs text-gray-500 mt-1">{scenario.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Adjustments */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Custom Adjustments</h3>
        <div className="space-y-3">
          {Object.keys(currentAllocation).map((symbol) => (
            <div key={symbol} className="flex items-center space-x-3">
              <div className="w-16 text-sm font-medium text-gray-900">{symbol}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={customAdjustments[symbol] || 0}
                    onChange={(e) => handleAdjustmentChange(symbol, parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-16 text-right">
                    {((customAdjustments[symbol] || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Current: {(currentAllocation[symbol] * 100).toFixed(1)}%</span>
                  <span>New: {(newAllocation[symbol] * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {Math.abs(totalAdjustment) > 0.01 && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Total adjustment: {(totalAdjustment * 100).toFixed(1)}%
                {Math.abs(totalAdjustment) > 0.1 && ' (Large change detected)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Simulation Actions */}
      <div className="flex space-x-3 mb-6">
        <button
          onClick={runSimulation}
          disabled={isSimulating}
          className="btn btn-primary flex-1"
        >
          {isSimulating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Simulating...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4 mr-2" />
              Run Simulation
            </>
          )}
        </button>
        <button
          onClick={resetSimulation}
          className="btn btn-outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </button>
      </div>

      {/* Simulation Results */}
      {simulationResult && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Simulation Results</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="metric-card">
                <div className="text-sm font-medium text-gray-500">Expected Return</div>
                <div className="text-lg font-bold text-gray-900">
                  {simulationResult.expectedReturn ? `${simulationResult.expectedReturn.toFixed(2)}%` : 'N/A'}
                </div>
              </div>
              <div className="metric-card">
                <div className="text-sm font-medium text-gray-500">Risk Score</div>
                <div className="text-lg font-bold text-gray-900">
                  {simulationResult.riskScore ? simulationResult.riskScore.toFixed(2) : 'N/A'}
                </div>
              </div>
            </div>
            
            {simulationResult.recommendations && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Recommendations</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {simulationResult.recommendations.map((rec: string, index: number) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portfolio Value Display */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Portfolio Value:</span>
          <span className="font-medium text-gray-900">${totalValue.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
