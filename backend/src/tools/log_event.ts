import * as Sentry from '@sentry/node';
import { generateToolCallId } from '../lib/uuid.js';
import { auditLogger } from '../lib/audit.js';
import { 
  LogEventInput, 
  SuccessResponse, 
  ErrorResponse 
} from '../lib/schema.js';

export async function logEvent(input: LogEventInput): Promise<SuccessResponse | ErrorResponse> {
  const toolCallId = generateToolCallId();
  const startTime = Date.now();

  // Add breadcrumb for tool execution
  if (process.env.SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message: 'Executing log_event tool',
      category: 'tool',
      data: {
        tool_name: 'log_event',
        tool_call_id: toolCallId,
        event_type: input.event_type,
        severity: input.severity
      },
      level: 'info'
    });
  }

  try {
    // Log the event using the audit logger
    const logEntry = {
      event_type: input.event_type,
      data: input.data,
      severity: input.severity || 'medium',
      timestamp: new Date().toISOString(),
      tool_call_id: toolCallId
    };

    // Write to audit log
    auditLogger.log({
      tool_call_id: toolCallId,
      tool_name: 'log_event',
      request: {
        method: 'POST',
        url: '/mcp/tools/log_event',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'finsage-mcp-server'
        },
        body: input,
        hash: 'log_event_request'
      },
      response: {
        status: 200,
        headers: {
          'content-type': 'application/json'
        },
        body: { logged: true, event_id: toolCallId },
        hash: 'log_event_response'
      },
      duration_ms: Date.now() - startTime
    });

    const response: SuccessResponse = {
      tool_call_id: toolCallId,
      data: {
        logged: true,
        event_id: toolCallId,
        source_refs: [toolCallId]
      }
    };

    const duration = Date.now() - startTime;
    auditLogger.logToolCall(toolCallId, 'log_event', input, response, duration);

    return response;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Capture exception in Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        tags: {
          tool_name: 'log_event',
          tool_call_id: toolCallId
        },
        extra: {
          input: input,
          duration_ms: duration
        }
      });
    }
    
    const errorResponse: ErrorResponse = {
      tool_call_id: toolCallId,
      error: {
        code: 'LOG_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error logging event'
      }
    };

    auditLogger.logToolCall(toolCallId, 'log_event', input, errorResponse, duration, {
      code: 'LOG_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return errorResponse;
  }
}
