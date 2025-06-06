/**
 * Logging API Route for Server-Side Logging
 * 
 * This API route allows client-side code to send logs to the server
 * for proper Axiom integration when needed.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logger, LogCategory, LogLevel } from '@/src/lib/logging';
import { z } from 'zod';

// Validation schema for log entries
const logEntrySchema = z.object({
  level: z.enum(['ERROR', 'WARN', 'INFO', 'DEBUG']),
  context: z.enum([
    'AUTH',
    'TOURNAMENT', 
    'API',
    'STORE',
    'GENERAL',
    'MIDDLEWARE',
    'DATABASE',
    'CACHE',
    'SYSTEM',
  ]),
  message: z.string(),
  data: z.record(z.unknown()).optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  requestId: z.string().optional(),
});

const batchLogSchema = z.object({
  logs: z.array(logEntrySchema).max(100), // Limit batch size
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    
    // Validate the request body
    const { logs } = batchLogSchema.parse(body);
    
    // Extract user context from headers if available
    const userId = request.headers.get('x-user-id');
    const sessionId = request.headers.get('x-session-id');
    const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
    
    // Process each log entry
    for (const logEntry of logs) {
      const context = {
        userId: logEntry.userId ?? userId ?? undefined,
        sessionId: logEntry.sessionId ?? sessionId ?? undefined,
        requestId: logEntry.requestId ?? requestId,
        userAgent: request.headers.get('user-agent') ?? undefined,
        url: request.headers.get('referer') ?? undefined,
      };
      
      const metadata = logEntry.data;
      
      // Map context string to LogCategory enum
      const categoryMap: Record<string, LogCategory> = {
        'AUTH': LogCategory.AUTH,
        'TOURNAMENT': LogCategory.TOURNAMENT,
        'API': LogCategory.API,
        'STORE': LogCategory.STORE,
        'GENERAL': LogCategory.GENERAL,
        'MIDDLEWARE': LogCategory.MIDDLEWARE,
        'DATABASE': LogCategory.DATABASE,
        'CACHE': LogCategory.CACHE,
        'SYSTEM': LogCategory.SYSTEM,
      };
      
      const category = categoryMap[logEntry.context] ?? LogCategory.GENERAL;
      
      // Use category-specific logging methods
      switch (category) {
        case LogCategory.AUTH:
          switch (logEntry.level) {
            case 'ERROR':
              logger.auth.error(logEntry.message, new Error(logEntry.message), context);
              break;
            case 'WARN':
              logger.auth.warn(logEntry.message, context, metadata);
              break;
            case 'INFO':
              logger.auth.info(logEntry.message, context, metadata);
              break;
            case 'DEBUG':
              logger.auth.debug(logEntry.message, context, metadata);
              break;
          }
          break;
        case LogCategory.API:
          switch (logEntry.level) {
            case 'ERROR':
              logger.api.error('CLIENT', logEntry.message, new Error(logEntry.message), context);
              break;
            default:
              logger.api.info(logEntry.message, context, metadata);
              break;
          }
          break;
        case LogCategory.CACHE:
          switch (logEntry.level) {
            case 'ERROR':
              logger.cache.error(logEntry.message, new Error(logEntry.message), context);
              break;
            case 'WARN':
              logger.cache.warn(logEntry.message, context, metadata);
              break;
            case 'INFO':
              logger.cache.info(logEntry.message, context, metadata);
              break;
            case 'DEBUG':
              logger.cache.debug(logEntry.message, context, metadata);
              break;
          }
          break;
        default:
          // Use general logging methods for other categories
          switch (logEntry.level) {
            case 'ERROR':
              logger.error(logEntry.message, new Error(logEntry.message), context);
              break;
            case 'WARN':
              logger.warn(logEntry.message, context, metadata);
              break;
            case 'INFO':
              logger.info(logEntry.message, context, metadata);
              break;
            case 'DEBUG':
              logger.debug(logEntry.message, context, metadata);
              break;
          }
          break;
      }
    }
    
    // Flush logs to Axiom
    await logger.flush();
    
    return NextResponse.json({ 
      success: true, 
      processed: logs.length,
      requestId 
    });
    
  } catch (error) {
    console.error('❌ Logging API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: crypto.randomUUID()
      },
      { status: 400 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'logging-api'
  });
}
