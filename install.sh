#!/bin/bash

# SPEAK-Client Installation Script
# This script installs all dependencies for the SPEAK client

set -e

echo "============================================"
echo "SPEAK Client Installation"
echo "============================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v18 or higher) first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    echo "   Please upgrade Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies
echo "📦 Installing client dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
else
    echo ""
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Setup environment file
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  Please update .env with your backend API URL if not using localhost"
else
    echo ""
    echo "ℹ️  .env file already exists, skipping..."
fi

echo ""
echo "============================================"
echo "✅ Installation Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Update .env file with your backend API URL"
echo "  2. Start the backend API service (Audio-Scraping-Service)"
echo "  3. Run './start.sh' to start the development server"
echo ""
