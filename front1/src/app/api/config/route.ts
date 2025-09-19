import { NextResponse } from 'next/server';
import { loadConfigSync } from '@/config';

export async function GET() {
  try {
    // Load configuration using server-side environment variables
    const config = loadConfigSync();
    
    // Return configuration with additional app-specific settings
    const response = {
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      localEndpoint: config.localEndpoint,
      remoteEndpoint: config.remoteEndpoint,
      requestTimeout: config.timeout,
      maxRetries: config.maxRetries,
      retryDelay: config.retryDelay,
      requestHeaders: config.headers,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load application configuration' },
      { status: 500 }
    );
  }
}