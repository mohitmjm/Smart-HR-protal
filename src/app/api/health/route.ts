export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
        HOST: process.env.HOST,
      },
      clerk: {
        secretKeyExists: !!process.env.CLERK_SECRET_KEY,
        publishableKeyExists: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        webhookSecretExists: !!process.env.CLERK_WEBHOOK_SECRET,
      },
      mongodb: {
        uriExists: !!process.env.MONGODB_URI,
        dbName: process.env.MONGODB_DB_NAME || 'hr',
      },
      headers: {
        userAgent: 'N/A', // Will be set by middleware if available
      }
    };

    return NextResponse.json(healthCheck);
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
