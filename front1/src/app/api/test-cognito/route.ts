import { NextResponse } from 'next/server';

export async function GET() {
  const authority = process.env.COGNITO_AUTHORITY;
  
  if (!authority) {
    return NextResponse.json({ error: 'No authority configured' }, { status: 500 });
  }

  try {
    // Test if we can fetch the OIDC discovery document
    const discoveryUrl = `${authority}/.well-known/openid_configuration`;
    const response = await fetch(discoveryUrl);
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch discovery document'
      }, { status: 500 });
    }

    const config = await response.json();
    
    return NextResponse.json({
      success: true,
      issuer: config.issuer,
      authorizationEndpoint: config.authorization_endpoint,
      tokenEndpoint: config.token_endpoint,
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Network error fetching discovery document'
    }, { status: 500 });
  }
}