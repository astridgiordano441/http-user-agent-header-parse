/**
 * http-user-agent-header-parse
 *
 * Parses the HTTP User-Agent header string into structured fields:
 * browser name and version, engine name and version, and operating system.
 *
 * Exports:
 *   parseUserAgent(ua: string): UserAgentInfo
 */
export { parseUserAgent } from './core.js';
