import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { format } from 'date-fns';

export interface AuditLogEntry {
  timestamp: string;
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
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

export class AuditLogger {
  private logDir: string;

  constructor(logDir: string = 'runtime_logs') {
    this.logDir = logDir;
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFilePath(): string {
    const today = format(new Date(), 'yyyy-MM-dd');
    const logDir = join(this.logDir, today);
    
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
    
    const filename = `audit-${format(new Date(), 'HH')}.jsonl`;
    return join(logDir, filename);
  }

  private hashObject(obj: any): string {
    const str = JSON.stringify(obj, null, 0);
    return createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  log(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    const logFile = this.getLogFilePath();
    
    const stream = createWriteStream(logFile, { flags: 'a' });
    stream.write(logLine);
    stream.end();
  }

  logToolCall(
    toolCallId: string,
    toolName: string,
    request: any,
    response: any,
    durationMs: number,
    error?: { code: string; message: string; stack?: string }
  ): void {
    const requestHash = this.hashObject(request);
    const responseHash = this.hashObject(response);

    this.log({
      tool_call_id: toolCallId,
      tool_name: toolName,
      request: {
        method: 'POST',
        url: `/mcp/tools/${toolName}`,
        headers: {
          'content-type': 'application/json',
          'user-agent': 'finsage-mcp-server'
        },
        body: request,
        hash: requestHash
      },
      response: {
        status: error ? 500 : 200,
        headers: {
          'content-type': 'application/json'
        },
        body: response,
        hash: responseHash
      },
      duration_ms: durationMs,
      error
    });
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();
