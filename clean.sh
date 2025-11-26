#!/bin/bash

echo "🧹 Cleaning up project..."

# Remove node_modules
echo "Removing node_modules..."
find . -type d -name "node_modules" -prune -exec rm -rf {} +

# Remove Python cache
echo "Removing Python cache..."
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type d -name ".pytest_cache" -exec rm -rf {} +
find . -type d -name "*.egg-info" -exec rm -rf {} +
find . -type d -name ".mypy_cache" -exec rm -rf {} +

# Remove build artifacts
echo "Removing build artifacts..."
find . -type d -name "dist" -not -path "*/node_modules/*" -exec rm -rf {} +
find . -type d -name "build" -not -path "*/node_modules/*" -exec rm -rf {} +
find . -type d -name "cdk.out" -exec rm -rf {} +
find . -type d -name ".cdk.out" -exec rm -rf {} +

# Remove logs
echo "Removing logs..."
find . -type f -name "*.log" -not -path "*/node_modules/*" -delete
find . -type d -name "logs" -not -path "*/node_modules/*" -exec rm -rf {} +

# Remove coverage
echo "Removing coverage..."
find . -type d -name "coverage" -not -path "*/node_modules/*" -exec rm -rf {} +
find . -type d -name ".nyc_output" -exec rm -rf {} +
find . -type d -name "htmlcov" -exec rm -rf {} +
find . -type f -name ".coverage" -delete

# Remove temporary files
echo "Removing temporary files..."
find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*~" \) -delete
find . -type d \( -name "tmp" -o -name "temp" -o -name ".tmp" \) -not -path "*/node_modules/*" -exec rm -rf {} +

# Remove OS files
echo "Removing OS files..."
find . -type f -name ".DS_Store" -delete

# Remove deployment artifacts
echo "Removing deployment artifacts..."
find . -type f -name "agent*_api.zip" -delete
find . -type f -name "deployment-*.json" -delete
find . -type f -name "packaged-template.yaml" -delete

# Remove AWS config (keep .env.example)
echo "Removing AWS config files..."
find . -type f -name ".bedrock_agentcore.yaml" -delete

echo "✅ Cleanup complete!"
