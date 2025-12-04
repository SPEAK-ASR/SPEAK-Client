#!/bin/bash

# SPEAK-Client Development Server Startup Script
# This script starts the Vite development server

set -e

echo "============================================"
echo "SPEAK Client - Starting Development Server"
echo "============================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not installed. Please run './install.sh' first."
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Using default values from .env.example"
    echo "   Consider creating .env file: cp .env.example .env"
    echo ""
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "🚀 Starting Vite development server..."
echo "   Client will be available at: http://localhost:5173"
echo "   API Backend: ${VITE_AUDIO_SCRAPING_API_URL:-http://localhost:8000/api/v1}"
echo ""
echo "   Press Ctrl+C to stop the server"
echo ""

# Start the development server
npm run dev
