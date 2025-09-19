#!/bin/bash

# Setup script for GenAI Market Data Analysis project
# This script helps new developers set up the project securely

set -e

echo "🚀 Setting up GenAI Market Data Analysis project..."

# Check if secrets.env exists
if [ ! -f "secrets.env" ]; then
    echo "📋 Creating secrets.env from template..."
    cp secrets.env.template secrets.env
    echo "✅ secrets.env created from template"
    echo "⚠️  Please edit secrets.env with your actual credentials before running the application"
else
    echo "✅ secrets.env already exists"
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment and install dependencies
echo "📦 Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt
echo "✅ Python dependencies installed"

# Check if Node.js dependencies are installed for frontend
if [ -d "front1" ] && [ ! -d "front1/node_modules" ]; then
    echo "📦 Installing Node.js dependencies for frontend..."
    cd front1
    npm install
    cd ..
    echo "✅ Node.js dependencies installed"
fi

# Set up git hooks for security (optional)
if [ -d ".git" ]; then
    echo "🔒 Setting up git hooks for security..."
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook to prevent committing secrets

# Check for common secret patterns
if git diff --cached --name-only | xargs grep -l "AKIA[0-9A-Z]\{16\}" 2>/dev/null; then
    echo "❌ Error: AWS Access Key detected in staged files"
    echo "Please remove secrets before committing"
    exit 1
fi

if git diff --cached --name-only | xargs grep -l "secrets\.env" 2>/dev/null; then
    echo "❌ Error: secrets.env file detected in staged files"
    echo "This file should not be committed"
    exit 1
fi

echo "✅ Pre-commit security check passed"
EOF
    chmod +x .git/hooks/pre-commit
    echo "✅ Git security hooks installed"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit secrets.env with your actual AWS credentials and API keys"
echo "2. Activate the virtual environment: source venv/bin/activate"
echo "3. Run the application: python main.py"
echo ""
echo "For deployment:"
echo "- Use ./front1/deploy-to-ecs-secure.sh for secure deployment"
echo "- See SECURITY.md for detailed security guidelines"
echo ""
echo "⚠️  Remember: Never commit secrets.env to version control!"