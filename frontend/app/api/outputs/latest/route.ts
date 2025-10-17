import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    // Path to backend runtime outputs (this would be the actual path in production)
    const runtimeOutputsPath = join(process.cwd(), '../backend/runtime_logs');
    
    try {
      // Get all date directories
      const dateDirs = await readdir(runtimeOutputsPath);
      const sortedDateDirs = dateDirs.sort().reverse(); // Most recent first
      
      if (sortedDateDirs.length === 0) {
        return NextResponse.json({
          error: 'No runtime logs found',
          stub: true,
          demo: true
        });
      }
      
      // Get the most recent date directory
      const latestDateDir = sortedDateDirs[0];
      const dateDirPath = join(runtimeOutputsPath, latestDateDir);
      
      // Get all JSON files in that directory
      const files = await readdir(dateDirPath);
      const jsonFiles = files.filter(file => file.endsWith('.jsonl'));
      
      if (jsonFiles.length === 0) {
        return NextResponse.json({
          error: 'No JSON files found in latest date directory',
          stub: true,
          demo: true
        });
      }
      
      // Get the most recent JSON file
      const latestFile = jsonFiles.sort().reverse()[0];
      const filePath = join(dateDirPath, latestFile);
      
      // Read the file content
      const fileContent = await readFile(filePath, 'utf-8');
      const lines = fileContent.trim().split('\n');
      
      // Parse the last line (most recent entry)
      const latestEntry = JSON.parse(lines[lines.length - 1]);
      
      return NextResponse.json({
        data: latestEntry,
        timestamp: latestEntry.timestamp,
        stub: true,
        demo: true
      });
      
    } catch (fsError) {
      // If we can't read from filesystem, return demo data
      console.warn('Could not read runtime logs, returning demo data:', fsError);
      
      return NextResponse.json({
        data: generateDemoData(),
        timestamp: new Date().toISOString(),
        stub: true,
        demo: true
      });
    }
    
  } catch (error) {
    console.error('Error fetching latest outputs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch latest outputs',
        data: generateDemoData(),
        timestamp: new Date().toISOString(),
        stub: true,
        demo: true
      },
      { status: 500 }
    );
  }
}

function generateDemoData() {
  return {
    tool_call_id: 'demo_' + Date.now(),
    tool_name: 'portfolio_analysis',
    request: {
      method: 'POST',
      url: '/mcp/tools/portfolio_analysis',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'finsage-mcp-server'
      },
      body: {
        symbols: ['AAPL', 'TSLA', 'SPY', 'MSFT'],
        analysis_type: 'comprehensive'
      },
      hash: 'demo_request_hash'
    },
    response: {
      status: 200,
      headers: {
        'content-type': 'application/json'
      },
      body: {
        portfolio: {
          positions: [
            {
              symbol: 'AAPL',
              quantity: 100,
              avg_price: 150.00,
              current_price: 175.43,
              market_value: 17543,
              weight: 0.25,
              change: 25.43,
              change_percent: 16.95
            },
            {
              symbol: 'TSLA',
              quantity: 50,
              avg_price: 200.00,
              current_price: 248.50,
              market_value: 12425,
              weight: 0.18,
              change: 48.50,
              change_percent: 24.25
            },
            {
              symbol: 'SPY',
              quantity: 200,
              avg_price: 400.00,
              current_price: 445.20,
              market_value: 89040,
              weight: 0.35,
              change: 45.20,
              change_percent: 11.30
            },
            {
              symbol: 'MSFT',
              quantity: 75,
              avg_price: 300.00,
              current_price: 385.75,
              market_value: 28931.25,
              weight: 0.22,
              change: 85.75,
              change_percent: 28.58
            }
          ],
          cash: 10000,
          total_value: 147939.25
        },
        signals: [
          {
            symbol: 'AAPL',
            type: 'valuation',
            signal: 'high_pe',
            confidence: 0.85,
            description: 'P/E ratio above threshold',
            value: 28.5,
            threshold: 25.0,
            source_refs: ['quote_001', 'fundamental_002']
          },
          {
            symbol: 'TSLA',
            type: 'technical',
            signal: 'rsi_oversold',
            confidence: 0.72,
            description: 'RSI indicates oversold condition',
            value: 25.3,
            threshold: 30.0,
            source_refs: ['technical_003']
          },
          {
            symbol: 'SPY',
            type: 'momentum',
            signal: 'golden_cross',
            confidence: 0.90,
            description: '50-day MA crossed above 200-day MA',
            value: 445.20,
            threshold: 440.00,
            source_refs: ['technical_004', 'history_005']
          }
        ],
        suggestions: [
          {
            symbol: 'AAPL',
            action: 'reduce_position',
            current_weight: 0.25,
            suggested_weight: 0.20,
            reasoning: 'High P/E ratio suggests overvaluation',
            confidence: 0.85,
            risk_level: 'medium',
            source_refs: ['signal_001', 'fundamental_002']
          },
          {
            symbol: 'TSLA',
            action: 'consider_buy',
            current_weight: 0.18,
            suggested_weight: 0.22,
            reasoning: 'RSI oversold condition presents opportunity',
            confidence: 0.72,
            risk_level: 'high',
            source_refs: ['signal_002', 'technical_003']
          }
        ],
        rebalance: {
          total_value: 147939.25,
          target_allocation: {
            'AAPL': 0.20,
            'TSLA': 0.22,
            'SPY': 0.35,
            'MSFT': 0.23
          },
          current_allocation: {
            'AAPL': 0.25,
            'TSLA': 0.18,
            'SPY': 0.35,
            'MSFT': 0.22
          },
          drift: 0.05,
          rebalance_needed: true,
          source_refs: ['portfolio_001', 'analysis_002']
        }
      },
      hash: 'demo_response_hash'
    },
    duration_ms: 150,
    timestamp: new Date().toISOString()
  };
}
