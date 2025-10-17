'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Play, Pause, RefreshCw } from 'lucide-react';
import SignalTable from '@/components/SignalTable';
import SuggestionCards from '@/components/SuggestionCards';
import RebalanceView from '@/components/RebalanceView';
import SourceRefs from '@/components/SourceRefs';
import TickerInputPanel from '@/components/TickerInputPanel';
import NewsFeed from '@/components/NewsFeed';
import SimulationPanel from '@/components/SimulationPanel';
import AgentInsightPanel from '@/components/AgentInsightPanel';
import AgentChatFeed from '@/components/AgentChatFeed';
import FinSageChat from '@/components/FinSageChat';
import BalanceSimulator from '@/components/BalanceSimulator';

interface PortfolioPosition {
  symbol: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  market_value: number;
  weight: number;
  change: number;
  change_percent: number;
}

interface Signal {
  symbol: string;
  type: string;
  signal: string;
  confidence: number;
  description: string;
  value: number;
  threshold: number;
  source_refs: string[];
}

interface Suggestion {
  symbol: string;
  action: string;
  current_weight: number;
  suggested_weight: number;
  reasoning: string;
  confidence: number;
  risk_level: string;
  source_refs: string[];
}

interface Rebalance {
  total_value: number;
  target_allocation: Record<string, number>;
  current_allocation: Record<string, number>;
  drift: number;
  rebalance_needed: boolean;
  source_refs: string[];
}

interface DashboardData {
  portfolio: {
    positions: PortfolioPosition[];
    cash: number;
    total_value: number;
  };
  signals: Signal[];
  suggestions: Suggestion[];
  rebalance: Rebalance;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedSourceRef, setSelectedSourceRef] = useState<string | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [userTickers, setUserTickers] = useState<string[]>([]);
  const [simulatedPortfolio, setSimulatedPortfolio] = useState<any[]>([]);
  const [simulatedCash, setSimulatedCash] = useState(10000);
  const [simulatedTotalValue, setSimulatedTotalValue] = useState(0);
  const [status, setStatus] = useState<{
    online: boolean;
    stub: boolean;
    url: string;
    error?: string;
  }>({
    online: false,
    stub: false,
    url: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
  });
  const [lastOutputFile, setLastOutputFile] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/outputs/latest');
      const result = await response.json();
      
      if (result.error) {
        setError(result.error);
      } else {
        // Handle both data structures: result.data.body (from logs) or result.data.response.body (from demo)
        const portfolioData = result.data.body || result.data.response?.body;
        if (portfolioData) {
          setData(portfolioData);
          setLastUpdated(new Date(result.timestamp));
          setLastOutputFile(result.filename || null);
        } else {
          setError('Invalid data structure received');
        }
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load user tickers from localStorage on mount
  useEffect(() => {
    const savedTickers = localStorage.getItem('finsage-user-tickers');
    if (savedTickers) {
      try {
        const parsedTickers = JSON.parse(savedTickers);
        setUserTickers(parsedTickers);
      } catch (error) {
        console.error('Failed to parse saved tickers:', error);
      }
    }
  }, []);

  // Save user tickers to localStorage whenever they change
  useEffect(() => {
    if (userTickers.length > 0) {
      localStorage.setItem('finsage-user-tickers', JSON.stringify(userTickers));
    }
  }, [userTickers]);

  const handleTickersChange = (newTickers: string[]) => {
    setUserTickers(newTickers);
  };

  const handleSimulate = async (scenario: string, adjustments: Record<string, number>) => {
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario,
          adjustments,
          currentAllocation: data?.rebalance.current_allocation || {}
        }),
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Simulation error:', error);
      throw error;
    }
  };

  const resetToDefaultPortfolio = () => {
    const defaultTickers = ['AAPL', 'TSLA', 'SPY', 'MSFT'];
    setUserTickers(defaultTickers);
    localStorage.setItem('finsage-user-tickers', JSON.stringify(defaultTickers));
    fetchData();
  };

  const handlePortfolioChange = (portfolio: any[], cash: number, totalValue: number) => {
    setSimulatedPortfolio(portfolio);
    setSimulatedCash(cash);
    setSimulatedTotalValue(totalValue);
    
    // Save to localStorage
    localStorage.setItem('finsage-simulated-portfolio', JSON.stringify({
      portfolio,
      cash,
      totalValue,
      timestamp: new Date().toISOString()
    }));
  };

  // Default portfolio for BalanceSimulator
  const defaultPortfolio = [
    { ticker: "AAPL", qty: 100, price: 175.43 },
    { ticker: "TSLA", qty: 50, price: 248.5 },
    { ticker: "SPY", qty: 200, price: 445.2 },
    { ticker: "MSFT", qty: 75, price: 385.75 },
  ];

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    console.log("Health check URL:", baseUrl + "/health");

    async function ping() {
      try {
        const res = await fetch(`${baseUrl}/health`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setStatus({ online: true, stub: !!data.stub, url: baseUrl });
        setIsDemoMode(!!data.stub);
      } catch (err) {
        setStatus({ online: false, stub: false, url: baseUrl, error: String(err) });
        setIsDemoMode(false);
      }
    }
    
    ping();
    fetchData();
    
    const t = setInterval(() => {
      ping();
      fetchData();
    }, 15000);
    
    return () => clearInterval(t);
  }, []);

  const handleRecordDemo = () => {
    setIsRecording(true);
    
    // Scroll through sections automatically
    const sections = ['portfolio', 'signals', 'suggestions'];
    let currentSection = 0;
    
    const scrollInterval = setInterval(() => {
      const element = document.getElementById(sections[currentSection]);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      currentSection++;
      
      if (currentSection >= sections.length) {
        clearInterval(scrollInterval);
        setIsRecording(false);
      }
    }, 3000);
  };

  const handleSourceRefClick = (sourceRef: string) => {
    setSelectedSourceRef(sourceRef);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading FinSage Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  const totalChange = data.portfolio.positions.reduce((sum, pos) => sum + pos.change, 0);
  const totalChangePercent = (totalChange / (data.portfolio.total_value - totalChange)) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Status Bar */}
      <div className="bg-gray-100 border-b border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">Backend:</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                status.online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {status.online ? "Online" : "Offline"}
              </span>
              {status.stub && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                  Demo Mode
                </span>
              )}
              <small className="text-gray-500">({status.url})</small>
            </div>
            {lastOutputFile && (
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700">Last Output:</span>
                <span className="text-gray-600 font-mono text-xs">{lastOutputFile}</span>
              </div>
            )}
          </div>
          <div className="text-gray-500">
            {lastUpdated && `Updated ${lastUpdated.toLocaleTimeString()}`}
          </div>
        </div>
      </div>

      {/* Top Banner */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">FinSage Dashboard</h1>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600">Live</span>
              </div>
              {isDemoMode && (
                <span className="chip chip-warning">
                  Demo Mode
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {lastUpdated && (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
            <button
              onClick={handleRecordDemo}
              disabled={isRecording}
              className={`btn ${isRecording ? 'btn-secondary' : 'btn-outline'}`}
            >
              {isRecording ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Recording...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Record Demo
                </>
              )}
            </button>
            <button
              onClick={resetToDefaultPortfolio}
              className="btn btn-outline"
            >
              Reset to Default
            </button>
            <button
              onClick={fetchData}
              className="btn btn-primary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content Area */}
          <section className="col-span-12 lg:col-span-8 space-y-6">
            {/* Portfolio Summary */}
            <div id="portfolio" className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Portfolio Summary</h2>
                <div className="flex items-center space-x-2">
                  {totalChange >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  <span className={`text-lg font-semibold ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)} ({totalChangePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="metric-card">
                  <div className="text-sm font-medium text-gray-500">Total Value</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${data.portfolio.total_value.toLocaleString()}
                  </div>
                </div>
                <div className="metric-card">
                  <div className="text-sm font-medium text-gray-500">Cash</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${data.portfolio.cash.toLocaleString()}
                  </div>
                </div>
                <div className="metric-card">
                  <div className="text-sm font-medium text-gray-500">Positions</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.portfolio.positions.length}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.portfolio.positions.map((position) => (
                      <tr 
                        key={position.symbol} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedTicker(position.symbol)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{position.symbol}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {position.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${position.current_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${position.market_value.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(position.weight * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${position.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {position.change >= 0 ? '+' : ''}${position.change.toFixed(2)} ({position.change_percent.toFixed(2)}%)
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Market Signals */}
            <div id="signals">
              <SignalTable 
                signals={data.signals} 
                onSourceRefClick={handleSourceRefClick}
              />
            </div>

            {/* Trading Suggestions */}
            <div id="suggestions">
              <SuggestionCards 
                suggestions={data.suggestions} 
                onSourceRefClick={handleSourceRefClick}
              />
            </div>

            {/* Portfolio Rebalance */}
            <div id="rebalance">
              <RebalanceView 
                rebalance={data.rebalance} 
                onSourceRefClick={handleSourceRefClick}
              />
            </div>

            {/* Simulation Panel */}
            <div id="simulation">
              <SimulationPanel
                currentAllocation={data.rebalance.current_allocation}
                totalValue={data.portfolio.total_value}
                onSimulate={handleSimulate}
                isLiveMode={!status.stub}
              />
            </div>
          </section>

          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            {/* Ticker Input Panel */}
            <TickerInputPanel
              currentTickers={userTickers}
              onTickersChange={handleTickersChange}
              onRefresh={fetchData}
            />

            {/* News Feed */}
            <NewsFeed
              selectedTicker={selectedTicker || undefined}
              isLiveMode={!status.stub}
            />

            {/* Agent Insights */}
            <AgentInsightPanel
              selectedTicker={selectedTicker || undefined}
              isLiveMode={!status.stub}
            />

            {/* Agent Chat Feed */}
            <AgentChatFeed
              isLiveMode={!status.stub}
            />

            {/* FinSage Chat Assistant */}
            <FinSageChat />

            {/* Balance Simulator */}
            <BalanceSimulator 
              initialPortfolio={defaultPortfolio}
            />
          </aside>
        </div>
      </div>

      {/* Source Reference Modal */}
      {selectedSourceRef && (
        <SourceRefs 
          sourceRef={selectedSourceRef}
          onClose={() => setSelectedSourceRef(null)}
        />
      )}
    </div>
  );
}
