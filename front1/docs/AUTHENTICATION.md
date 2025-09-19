# Authentication Setup

This application uses AWS Cognito for user authentication via the OIDC (OpenID Connect) protocol.

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure the following variables:

```bash
# AWS Cognito Configuration
NEXT_PUBLIC_COGNITO_AUTHORITY=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000
NEXT_PUBLIC_COGNITO_DOMAIN=https://your-domain.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_SCOPE=phone openid email
```

### AWS Cognito Setup

1. **Create a User Pool** in AWS Cognito
2. **Configure App Client** with the following settings:
   - Enable "Authorization code grant"
   - Add your domain to "Allowed callback URLs"
   - Add your domain to "Allowed sign-out URLs"
   - Enable "OpenID Connect" scopes

3. **Update Environment Variables** with your User Pool details:
   - `COGNITO_AUTHORITY`: Your User Pool's OIDC issuer URL
   - `COGNITO_CLIENT_ID`: Your App Client ID
   - `COGNITO_DOMAIN`: Your Cognito Domain URL

## Components

### AuthProvider
Wraps the entire application with OIDC authentication context.

### ProtectedRoute
Protects routes by automatically redirecting unauthenticated users to Cognito for sign-in.

### UserProfile
Shows user information and provides sign-out functionality.

## Usage

### Protecting Routes
```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ProtectedPage() {
  return (
    <ProtectedRoute>
      <YourProtectedContent />
    </ProtectedRoute>
  );
}
```

### Using Authentication Hook
```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, signOut } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }
  
  return (
    <div>
      <p>Welcome, {user?.profile.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## Security Features

- **OIDC Standard**: Uses industry-standard OpenID Connect protocol
- **Secure Tokens**: JWT tokens with proper validation
- **Automatic Renewal**: Silent token renewal for seamless experience
- **Complete Logout**: Option for both local and complete Cognito logout

## Development

For local development, ensure your Cognito App Client allows `http://localhost:3000` as a callback URL.

For production, update the redirect URIs to match your production domain.