'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, AlertCircle } from 'lucide-react';

interface SourceRefsProps {
  sourceRef: string;
  onClose: () => void;
}

interface ToolPayload {
  tool_call_id: string;
  tool_name: string;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: any;
    hash: string;
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body: any;
    hash: string;
  };
  duration_ms: number;
  timestamp: string;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

export default function SourceRefs({ sourceRef, onClose }: SourceRefsProps) {
  const [payload, setPayload] = useState<ToolPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchToolPayload();
  }, [sourceRef]);

  const fetchToolPayload = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would fetch from the backend runtime logs
      // For now, we'll simulate the data
      const mockPayload: ToolPayload = {
        tool_call_id: sourceRef,
        tool_name: getToolNameFromRef(sourceRef),
        request: {
          method: 'POST',
          url: `/mcp/tools/${getToolNameFromRef(sourceRef)}`,
          headers: {
            'content-type': 'application/json',
            'user-agent': 'finsage-mcp-server'
          },
          body: generateMockRequestBody(sourceRef),
          hash: 'sha256_hash_of_request'
        },
        response: {
          status: 200,
          headers: {
            'content-type': 'application/json'
          },
          body: generateMockResponseBody(sourceRef),
          hash: 'sha256_hash_of_response'
        },
        duration_ms: Math.floor(Math.random() * 200) + 50,
        timestamp: new Date().toISOString()
      };
      
      setPayload(mockPayload);
    } catch (err) {
      setError('Failed to fetch tool payload');
      console.error('Error fetching tool payload:', err);
    } finally {
      setLoading(false);
    }
  };

  const getToolNameFromRef = (ref: string): string => {
    if (ref.includes('quote')) return 'get_quotes';
    if (ref.includes('fundamental')) return 'get_fundamentals';
    if (ref.includes('news')) return 'get_news';
    if (ref.includes('history')) return 'get_history';
    if (ref.includes('portfolio')) return 'get_portfolio';
    if (ref.includes('signal')) return 'signal_analysis';
    if (ref.includes('analysis')) return 'portfolio_analysis';
    return 'unknown_tool';
  };

  const generateMockRequestBody = (ref: string) => {
    const toolName = getToolNameFromRef(ref);
    switch (toolName) {
      case 'get_quotes':
        return { symbols: ['AAPL', 'TSLA'], fields: ['price', 'volume'] };
      case 'get_fundamentals':
        return { symbols: ['AAPL', 'TSLA'], metrics: ['pe_ratio', 'peg_ratio'] };
      case 'get_news':
        return { symbols: ['AAPL'], hours_back: 24 };
      case 'get_history':
        return { symbol: 'AAPL', period: '1mo', interval: '1d' };
      case 'get_portfolio':
        return { user_id: 'demo_user' };
      default:
        return { analysis_type: 'comprehensive' };
    }
  };

  const generateMockResponseBody = (ref: string) => {
    const toolName = getToolNameFromRef(ref);
    switch (toolName) {
      case 'get_quotes':
        return {
          tool_call_id: ref,
          data: {
            quotes: [
              { symbol: 'AAPL', price: 175.43, change: 2.15, change_percent: 1.24, volume: 45678900, timestamp: new Date().toISOString() },
              { symbol: 'TSLA', price: 248.50, change: -1.20, change_percent: -0.48, volume: 78912300, timestamp: new Date().toISOString() }
            ],
            source_refs: [ref]
          }
        };
      case 'get_fundamentals':
        return {
          tool_call_id: ref,
          data: {
            fundamentals: [
              { symbol: 'AAPL', pe_ratio: 28.5, peg_ratio: 1.2, ev_ebitda: 22.1, roic: 0.15, gross_margin: 0.42, current_ratio: 1.8, debt_to_equity: 0.3, timestamp: new Date().toISOString() }
            ],
            source_refs: [ref]
          }
        };
      default:
        return {
          tool_call_id: ref,
          data: { result: 'success', source_refs: [ref] }
        };
    }
  };

  const copyToClipboard = async () => {
    if (payload) {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
            <span>Loading tool payload...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tool Payload</h2>
            <p className="text-sm text-gray-500">Source Reference: {sourceRef}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={copyToClipboard}
              className="btn btn-outline text-sm"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="btn btn-outline text-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-2">{error}</p>
                <button
                  onClick={fetchToolPayload}
                  className="btn btn-primary"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : payload ? (
            <div className="space-y-6">
              {/* Tool Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="metric-card">
                  <div className="text-sm font-medium text-gray-500">Tool Name</div>
                  <div className="text-lg font-bold text-gray-900">{payload.tool_name}</div>
                </div>
                <div className="metric-card">
                  <div className="text-sm font-medium text-gray-500">Duration</div>
                  <div className="text-lg font-bold text-gray-900">{payload.duration_ms}ms</div>
                </div>
              </div>

              {/* Request */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Request</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Method</div>
                      <div className="text-sm text-gray-900">{payload.request.method}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">URL</div>
                      <div className="text-sm text-gray-900">{payload.request.url}</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-500 mb-2">Headers</div>
                    <pre className="text-xs text-gray-700 bg-white p-2 rounded border overflow-x-auto">
                      {JSON.stringify(payload.request.headers, null, 2)}
                    </pre>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-500 mb-2">Body</div>
                    <pre className="text-xs text-gray-700 bg-white p-2 rounded border overflow-x-auto">
                      {JSON.stringify(payload.request.body, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Hash</div>
                    <div className="text-xs text-gray-700 font-mono">{payload.request.hash}</div>
                  </div>
                </div>
              </div>

              {/* Response */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Response</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Status</div>
                      <div className={`text-sm font-bold ${
                        payload.response.status >= 200 && payload.response.status < 300 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {payload.response.status}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Content-Type</div>
                      <div className="text-sm text-gray-900">{payload.response.headers['content-type']}</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-500 mb-2">Body</div>
                    <pre className="text-xs text-gray-700 bg-white p-2 rounded border overflow-x-auto max-h-64">
                      {JSON.stringify(payload.response.body, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Hash</div>
                    <div className="text-xs text-gray-700 font-mono">{payload.response.hash}</div>
                  </div>
                </div>
              </div>

              {/* Error (if any) */}
              {payload.error && (
                <div>
                  <h3 className="text-lg font-medium text-red-600 mb-3">Error</h3>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="mb-2">
                      <div className="text-sm font-medium text-red-800">Code</div>
                      <div className="text-sm text-red-700">{payload.error.code}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-sm font-medium text-red-800">Message</div>
                      <div className="text-sm text-red-700">{payload.error.message}</div>
                    </div>
                    {payload.error.stack && (
                      <div>
                        <div className="text-sm font-medium text-red-800 mb-2">Stack Trace</div>
                        <pre className="text-xs text-red-700 bg-white p-2 rounded border overflow-x-auto">
                          {payload.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Metadata</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Timestamp</div>
                      <div className="text-sm text-gray-900">{new Date(payload.timestamp).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Tool Call ID</div>
                      <div className="text-sm text-gray-900 font-mono">{payload.tool_call_id}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
