/**
 * CORS Configuration Utility
 * Industry standard CORS implementation for Next.js API routes
 */

import { config } from './config';

export interface CorsConfig {
  allowedOrigins: (string | RegExp)[];
  allowedMethods: string[];
  allowedHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

/**
 * Get CORS configuration based on environment
 */
export function getCorsConfig(): CorsConfig {
  return {
    allowedOrigins: config.api.cors.allowedOrigins,
    allowedMethods: config.api.cors.allowedMethods,
    allowedHeaders: config.api.cors.allowedHeaders,
    maxAge: 86400, // 24 hours
    credentials: config.isProduction, // Only allow credentials in production
  };
}

/**
 * Generate CORS headers for a specific origin
 */
export function generateCorsHeaders(origin?: string): Record<string, string> {
  const corsConfig = getCorsConfig();
  
  // Determine allowed origin
  let allowedOrigin = '*';
  if (corsConfig.allowedOrigins.length > 0 && corsConfig.allowedOrigins[0] !== '*') {
    if (origin && corsConfig.allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin || allowed === '*';
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    })) {
      allowedOrigin = origin;
    } else if (corsConfig.allowedOrigins.length === 1) {
      const firstOrigin = corsConfig.allowedOrigins[0];
      if (typeof firstOrigin === 'string') {
        allowedOrigin = firstOrigin;
      } else {
        // If it's a regex, we can't use it directly in headers, so use origin if it matches
        if (origin && firstOrigin.test(origin)) {
          allowedOrigin = origin;
        } else {
          allowedOrigin = '*';
        }
      }
    }
  }

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': corsConfig.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': corsConfig.allowedHeaders.join(', '),
    'Access-Control-Max-Age': corsConfig.maxAge.toString(),
  };

  if (corsConfig.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflight(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin') || '';
    const headers = generateCorsHeaders(origin);
    
    return new Response(null, {
      status: 200,
      headers
    });
  }
  
  return null;
}

/**
 * Apply CORS headers to a response
 */
export function applyCorsHeaders(
  response: Response, 
  origin?: string
): Response {
  const corsHeaders = generateCorsHeaders(origin);
  
  // Apply CORS headers to the response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * CORS middleware for Next.js API routes
 */
export function withCors<T extends any[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    const request = args[0] as Request;
    const origin = request.headers.get('origin') || '';
    
    // Handle preflight request
    if (request.method === 'OPTIONS') {
      return handleCorsPreflight(request)!;
    }
    
    // Execute the handler
    const response = await handler(...args);
    
    // Apply CORS headers
    return applyCorsHeaders(response, origin);
  };
}
