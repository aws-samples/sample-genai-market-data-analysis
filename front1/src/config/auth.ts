// Server-side configuration interface
export interface AuthConfig {
  authority: string;
  client_id: string;
  redirect_uri: string;
  logout_uri: string;
  domain: string;
  scope: string;
  response_type: string;
  automaticSilentRenew: boolean;
  loadUserInfo: boolean;
}

// Server-side function to get auth configuration
export const getServerAuthConfig = (): AuthConfig => {
  const authority = process.env.COGNITO_AUTHORITY;
  const client_id = process.env.COGNITO_CLIENT_ID;
  const redirect_uri = process.env.COGNITO_REDIRECT_URI;
  const logout_uri = process.env.COGNITO_LOGOUT_URI;
  const domain = process.env.COGNITO_DOMAIN;
  const scope = process.env.COGNITO_SCOPE;

  if (!authority || !client_id || !redirect_uri || !logout_uri || !domain || !scope) {
    throw new Error('Missing required authentication environment variables');
  }

  return {
    authority,
    client_id,
    redirect_uri,
    logout_uri,
    domain,
    scope,
    response_type: "code",
    automaticSilentRenew: true,
    loadUserInfo: true,
  };
};

// Client-side configuration that will be populated from API
export let cognitoAuthConfig: AuthConfig | null = null;

// Function to load auth config from API
export const loadAuthConfig = async (): Promise<AuthConfig> => {
  if (cognitoAuthConfig) {
    return cognitoAuthConfig;
  }

  try {
    const response = await fetch('/api/auth/config');
    if (!response.ok) {
      throw new Error(`Failed to load auth config: ${response.statusText}`);
    }
    
    cognitoAuthConfig = await response.json();
    return cognitoAuthConfig!;
  } catch (error) {
    throw new Error('Failed to load auth configuration');
  }
};

export const getCognitoLogoutUrl = (config?: AuthConfig) => {
  const authConfig = config || cognitoAuthConfig;
  if (!authConfig) {
    throw new Error('Auth configuration not loaded');
  }
  
  return `${authConfig.domain}/logout?client_id=${authConfig.client_id}&logout_uri=${encodeURIComponent(authConfig.logout_uri)}`;
};