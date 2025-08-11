# Configuration Guide

This document explains how to configure the Next.js Chat Application using environment variables.

## Environment Variables

The application uses environment variables for configuration. All variables are prefixed with `NEXT_PUBLIC_` to make them available in the browser.

### Required Variables

- `NEXT_PUBLIC_LOCAL_ENDPOINT`: URL for the local API endpoint (default: `http://127.0.0.1:8080/invocations`)

### Optional Variables

- `NEXT_PUBLIC_REMOTE_ENDPOINT`: URL for the remote API endpoint (default: empty string)
- `NEXT_PUBLIC_REQUEST_TIMEOUT`: Request timeout in milliseconds (default: `900000` - 15 minutes)
- `NEXT_PUBLIC_MAX_RETRIES`: Maximum number of retry attempts (default: `3`)
- `NEXT_PUBLIC_RETRY_DELAY`: Base delay between retries in milliseconds (default: `1000`)
- `NEXT_PUBLIC_REQUEST_HEADERS`: Additional HTTP headers as JSON string (default: `{"Content-Type":"application/json"}`)

## Setup Instructions

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your configuration:
   ```bash
   # API Endpoints
   NEXT_PUBLIC_LOCAL_ENDPOINT=http://127.0.0.1:8080/invocations
   NEXT_PUBLIC_REMOTE_ENDPOINT=https://your-api.com/chat
   
   # Request Configuration
   NEXT_PUBLIC_REQUEST_TIMEOUT=900000
   NEXT_PUBLIC_MAX_RETRIES=3
   NEXT_PUBLIC_RETRY_DELAY=1000
   
   # Request Headers (JSON format)
   NEXT_PUBLIC_REQUEST_HEADERS={"Content-Type":"application/json","Authorization":"Bearer your-token"}
   ```

## Configuration Validation

The application validates all configuration values on startup:

- **URLs**: Must be valid HTTP/HTTPS URLs
- **Timeouts**: Must be positive integers (in milliseconds)
- **Retries**: Must be non-negative integers (0 or greater)
- **Headers**: Must be valid JSON objects

Invalid configuration will cause the application to fail with descriptive error messages.

## Examples

### Basic Local Development
```bash
NEXT_PUBLIC_LOCAL_ENDPOINT=http://localhost:8080/invocations
NEXT_PUBLIC_REMOTE_ENDPOINT=
```

### Production with Authentication
```bash
NEXT_PUBLIC_LOCAL_ENDPOINT=http://127.0.0.1:8080/invocations
NEXT_PUBLIC_REMOTE_ENDPOINT=https://api.production.com/chat
NEXT_PUBLIC_REQUEST_HEADERS={"Content-Type":"application/json","Authorization":"Bearer prod-token","X-API-Version":"v1"}
```

### Custom Timeouts and Retries
```bash
NEXT_PUBLIC_REQUEST_TIMEOUT=60000
NEXT_PUBLIC_MAX_RETRIES=5
NEXT_PUBLIC_RETRY_DELAY=2000
```

## Troubleshooting

### Common Issues

1. **Invalid URL Error**: Ensure URLs include the protocol (`http://` or `https://`)
2. **JSON Parse Error**: Verify that `NEXT_PUBLIC_REQUEST_HEADERS` is valid JSON
3. **Timeout Too Small**: Ensure timeout values are reasonable for your API response times
4. **Missing Local Endpoint**: The local endpoint is required and cannot be empty

### Error Messages

The configuration system provides detailed error messages:

```
Configuration validation failed:
NEXT_PUBLIC_LOCAL_ENDPOINT must be a valid URL, got: invalid-url
NEXT_PUBLIC_REQUEST_TIMEOUT must be a positive integer, got: -1000
```

### Testing Configuration

You can test your configuration by running the application in development mode:

```bash
npm run dev
```

Any configuration errors will be displayed in the console during startup.

## Environment-Specific Configuration

### Development (.env.local)
```bash
NEXT_PUBLIC_LOCAL_ENDPOINT=http://localhost:8080/invocations
NEXT_PUBLIC_REMOTE_ENDPOINT=http://localhost:3001/api/chat
NEXT_PUBLIC_REQUEST_TIMEOUT=30000
```

### Production (.env.production.local)
```bash
NEXT_PUBLIC_LOCAL_ENDPOINT=http://127.0.0.1:8080/invocations
NEXT_PUBLIC_REMOTE_ENDPOINT=https://api.production.com/chat
NEXT_PUBLIC_REQUEST_TIMEOUT=900000
NEXT_PUBLIC_REQUEST_HEADERS={"Content-Type":"application/json","Authorization":"Bearer prod-token"}
```

## Security Considerations

- Never commit `.env.local` or other environment files containing sensitive data
- Use different API keys/tokens for different environments
- Consider using environment-specific configuration files
- Validate all configuration values to prevent injection attacks

## Advanced Configuration

### Custom Headers

You can add custom headers for authentication, API versioning, or other purposes:

```bash
NEXT_PUBLIC_REQUEST_HEADERS={"Content-Type":"application/json","Authorization":"Bearer token","X-API-Version":"v2","X-Client-ID":"chat-app"}
```

### Retry Configuration

Configure retry behavior for different network conditions:

```bash
# For unreliable networks
NEXT_PUBLIC_MAX_RETRIES=5
NEXT_PUBLIC_RETRY_DELAY=2000

# For stable networks
NEXT_PUBLIC_MAX_RETRIES=1
NEXT_PUBLIC_RETRY_DELAY=500
```

### Timeout Configuration

Adjust timeouts based on your API performance:

```bash
# For fast APIs
NEXT_PUBLIC_REQUEST_TIMEOUT=30000

# For slow/complex processing
NEXT_PUBLIC_REQUEST_TIMEOUT=1800000
```