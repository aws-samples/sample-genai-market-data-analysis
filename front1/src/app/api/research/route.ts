import { NextRequest, NextResponse } from 'next/server';
import { bedrockAgentService } from '@/services/bedrockAgentService';

// Configure route segment for long-running requests
export const maxDuration = 3600; // 30 minutes in seconds
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Invoke the Bedrock Agent with timeout handling
    const result = await bedrockAgentService.invokeAgent(query);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to process research query' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content: result.content,
      timestamp: new Date().toISOString(),
      source: 'bedrock-agent',
    });

  } catch (error) {
    // Handle timeout errors specifically
    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timeout: The research query took too long to complete' },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const isHealthy = await bedrockAgentService.healthCheck();
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'bedrock-agent',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        service: 'bedrock-agent',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}