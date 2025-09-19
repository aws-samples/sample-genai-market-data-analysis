import { NextResponse } from 'next/server';
import { getServerAuthConfig } from '@/config/auth';

export async function GET() {
  try {
    const config = getServerAuthConfig();
    
    // Return only the client-safe configuration
    return NextResponse.json({
      authority: config.authority,
      client_id: config.client_id,
      redirect_uri: config.redirect_uri,
      logout_uri: config.logout_uri,
      domain: config.domain,
      scope: config.scope,
      response_type: config.response_type,
      automaticSilentRenew: config.automaticSilentRenew,
      loadUserInfo: config.loadUserInfo,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load authentication configuration' },
      { status: 500 }
    );
  }
}