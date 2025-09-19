#!/bin/bash

# Update AWS SDK packages to latest versions
# This script ensures we always have the latest AWS SDK packages

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_info "Updating AWS SDK packages to latest versions..."

# Get current versions
CURRENT_BEDROCK=$(npm list @aws-sdk/client-bedrock-agentcore --depth=0 2>/dev/null | grep @aws-sdk/client-bedrock-agentcore | sed 's/.*@//' | sed 's/ .*//' || echo "not installed")
CURRENT_CREDS=$(npm list @aws-sdk/credential-providers --depth=0 2>/dev/null | grep @aws-sdk/credential-providers | sed 's/.*@//' | sed 's/ .*//' || echo "not installed")

echo_info "Current versions:"
echo_info "  @aws-sdk/client-bedrock-agentcore: $CURRENT_BEDROCK"
echo_info "  @aws-sdk/credential-providers: $CURRENT_CREDS"

# Update packages
echo_info "Updating packages..."
npm update @aws-sdk/client-bedrock-agentcore @aws-sdk/credential-providers

# Get new versions
NEW_BEDROCK=$(npm list @aws-sdk/client-bedrock-agentcore --depth=0 2>/dev/null | grep @aws-sdk/client-bedrock-agentcore | sed 's/.*@//' | sed 's/ .*//')
NEW_CREDS=$(npm list @aws-sdk/credential-providers --depth=0 2>/dev/null | grep @aws-sdk/credential-providers | sed 's/.*@//' | sed 's/ .*//')

echo_info "Updated versions:"
echo_info "  @aws-sdk/client-bedrock-agentcore: $NEW_BEDROCK"
echo_info "  @aws-sdk/credential-providers: $NEW_CREDS"

# Check if versions changed
if [ "$CURRENT_BEDROCK" != "$NEW_BEDROCK" ] || [ "$CURRENT_CREDS" != "$NEW_CREDS" ]; then
    echo_info "AWS SDK packages have been updated!"
    echo_warn "Consider running tests to ensure compatibility with the new versions."
else
    echo_info "AWS SDK packages were already up to date."
fi

echo_info "AWS SDK update completed successfully!"