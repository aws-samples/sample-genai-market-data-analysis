# Memory-optimized single-stage build
FROM --platform=linux/amd64 node:18-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat curl

# Set working directory
WORKDIR /app

# Copy package files first
COPY package.json package-lock.json* ./

# Install dependencies with optimizations
RUN npm ci --no-audit --no-fund && npm cache clean --force

# Copy all source code
COPY . .

# Set build environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV BEDROCK_AGENT_RUNTIME_ARN=dummy-arn-for-build
ENV AWS_REGION=us-east-1

# No build-time environment variables needed - all configuration is runtime

# Build with maximum memory allocation and garbage collection optimizations

RUN npm run build

# Clean up build dependencies to free memory
RUN npm prune --production && npm cache clean --force

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Change ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set runtime environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]