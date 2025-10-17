'use client';

import { useState } from 'react';
import { Plus, X, Search, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TickerInputPanelProps {
  currentTickers: string[];
  onTickersChange: (tickers: string[]) => void;
  onRefresh: () => void;
}

export default function TickerInputPanel({ 
  currentTickers, 
  onTickersChange, 
  onRefresh 
}: TickerInputPanelProps) {
  const [newTicker, setNewTicker] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTicker = async () => {
    if (!newTicker.trim()) return;
    
    const ticker = newTicker.trim().toUpperCase();
    
    // Validate ticker format (basic validation)
    if (!/^[A-Z]{1,5}$/.test(ticker)) {
      setError('Invalid ticker format. Use 1-5 uppercase letters.');
      return;
    }
    
    if (currentTickers.includes(ticker)) {
      setError('Ticker already exists in portfolio.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate ticker exists by checking quotes
      const response = await fetch(`/api/quotes?symbols=${ticker}`);
      const data = await response.json();
      
      if (data.error || !data.quotes || data.quotes.length === 0) {
        setError('Ticker not found or invalid.');
        return;
      }

      // Add ticker to portfolio
      const updatedTickers = [...currentTickers, ticker];
      onTickersChange(updatedTickers);
      setNewTicker('');
      
      // Trigger refresh to update portfolio data
      onRefresh();
      
    } catch (err) {
      setError('Failed to validate ticker. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTicker = (tickerToRemove: string) => {
    const updatedTickers = currentTickers.filter(ticker => ticker !== tickerToRemove);
    onTickersChange(updatedTickers);
    onRefresh();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTicker();
    }
  };

  const popularTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'SPY', 'QQQ'];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Portfolio Tickers</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{currentTickers.length} symbols</span>
        </div>
      </div>

      {/* Add New Ticker */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add ticker (e.g., AAPL)"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleAddTicker}
            disabled={isLoading || !newTicker.trim()}
            className="btn btn-primary px-4 py-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </div>
        
        {error && (
          <div className="mt-2 flex items-center space-x-2 text-red-600 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Current Tickers */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Current Portfolio</h3>
        {currentTickers.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No tickers added yet</p>
            <p className="text-xs text-gray-400">Add tickers to start monitoring</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {currentTickers.map((ticker) => (
                <motion.div
                  key={ticker}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                >
                  <span className="text-sm font-medium text-blue-900">{ticker}</span>
                  <button
                    onClick={() => handleRemoveTicker(ticker)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Popular Tickers */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Tickers</h3>
        <div className="flex flex-wrap gap-2">
          {popularTickers.map((ticker) => (
            <button
              key={ticker}
              onClick={() => {
                if (!currentTickers.includes(ticker)) {
                  setNewTicker(ticker);
                  handleAddTicker();
                }
              }}
              disabled={currentTickers.includes(ticker)}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                currentTickers.includes(ticker)
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              {ticker}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={onRefresh}
            className="btn btn-outline flex-1 text-sm"
          >
            Refresh All
          </button>
          <button
            onClick={() => onTickersChange([])}
            className="btn btn-outline text-sm px-3"
            disabled={currentTickers.length === 0}
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}
