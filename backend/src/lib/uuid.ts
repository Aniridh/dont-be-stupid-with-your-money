import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique tool call ID for MCP tool calls
 * @returns A UUID v4 string
 */
export function generateToolCallId(): string {
  return uuidv4();
}

/**
 * Validate that a string is a valid UUID v4
 * @param id The string to validate
 * @returns True if valid UUID v4, false otherwise
 */
export function isValidToolCallId(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
