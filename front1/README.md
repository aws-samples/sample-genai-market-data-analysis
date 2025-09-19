# Financial Research Assistant

A Next.js-based financial research platform with AWS Cognito authentication and Bedrock Agent integration for AI-powered market analysis.

## Features

- 🔐 **Secure Authentication** - AWS Cognito with OIDC
- 🤖 **AI Research** - AWS Bedrock Agent integration
- 💼 **Professional UI** - Clean, responsive design
- 🚀 **Real-time Chat** - Interactive research sessions
- ♿ **Accessibility** - WCAG compliant

## Quick Start

### Prerequisites
- Node.js 18+
- AWS Account with Cognito and Bedrock access

### Installation
```bash
git clone <repository-url>
cd nextjs-chat-app
npm install
cp .env.example .env.local
# Configure environment variables
npm run dev
```

## Configuration

### Environment Variables
```env
# AWS Cognito (Server-side)
COGNITO_AUTHORITY=https://cognito-idp.{region}.amazonaws.com/{user-pool-id}
COGNITO_CLIENT_ID=your-cognito-client-id
COGNITO_REDIRECT_URI=https://your-domain.com/auth-callback
COGNITO_LOGOUT_URI=https://your-domain.com
COGNITO_DOMAIN=https://your-domain.auth.{region}.amazoncognito.com
COGNITO_SCOPE=email openid phone

# Application Configuration
APP_URL=https://your-domain.com
LOCAL_ENDPOINT=http://127.0.0.1:8080/invocations
REQUEST_TIMEOUT=1800000  # 30 minutes
MAX_RETRIES=3
RETRY_DELAY=1000

# AWS Bedrock
AWS_REGION=us-east-1
BEDROCK_AGENT_RUNTIME_ARN=arn:aws:bedrock-agentcore:{region}:{account}:runtime/{agent}
BEDROCK_AGENT_QUALIFIER=DEFAULT
```

### Configuration Validation
- URLs must be valid HTTP/HTTPS
- Timeouts must be positive integers (milliseconds)
- Retries must be non-negative integers
- Headers must be valid JSON objects

## Development

### Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run test         # Unit tests
npm run test:e2e     # End-to-end tests
npm run lint         # Code linting
```

### Project Structure
```
src/
├── app/            # Next.js app router
├── components/     # React components
├── services/       # API services
├── config/         # Configuration
└── types/          # TypeScript definitions
```

## Testing

### Test Coverage
- **Unit Tests**: Components, services, hooks
- **E2E Tests**: Complete workflows, responsive design
- **Accessibility**: WCAG compliance, keyboard navigation
- **Performance**: Large message histories, memory usage

```bash
npm run test                # Unit tests
npm run test:e2e           # E2E tests
npm run test:comprehensive # All tests
```

## Deployment

### ECS Deployment
```bash
./deploy-to-ecs.sh
```

### Environment-Specific Configuration
- **Development**: Use `.env.local`
- **Production**: Set environment variables in ECS task definition
- **Security**: Never commit environment files with secrets

## Architecture

### Authentication Flow
1. User accesses protected route
2. Redirected to AWS Cognito hosted UI
3. After authentication, redirected back with tokens
4. Tokens used for secure API calls

### AI Research Flow
1. User submits research query
2. Query sent to AWS Bedrock Agent
3. Agent processes and returns structured response
4. Response formatted and displayed

## API Integration

### Timeout Configuration
- **Default**: 30 minutes (1,800,000 ms)
- **Retries**: 3 attempts with exponential backoff
- **Total Time**: Up to ~120 minutes with retries

### Error Handling
- Network connectivity issues
- AWS service errors
- Authentication failures
- Rate limiting and timeouts

## Performance & Security

### Performance
- Lighthouse Score: 95+
- Optimized bundle size with code splitting
- Efficient message rendering

### Security
- Server-side environment variables
- HTTPS enforcement
- Input validation and sanitization
- AWS IAM roles in production

## Browser Support
Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## License
MIT License - see LICENSE file for details