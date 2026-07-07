#!/bin/bash

# Setup Kantongin Local Testing Environment

cd "$(dirname "$0")"

# Check Python and Node
if ! command -v python3 >/dev/null 2>&1; then
    echo "❌ Python3 not found. Please install Python 3.x"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm not found. Please install Node.js"
    exit 1
fi

# Backup original files
if [ ! -f ".env.backup" ]; then
    cp .env .env.backup 2>/dev/null || true
fi

# Create .env file for local development
echo "# Supabase Configuration for Local Development" > .env
echo "VITE_SUPABASE_URL=https://gzsbdujrgqwdbrcokpfm.supabase.co" >> .env
echo "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6c2JkdWpyZ3F3ZGJyY29rcGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODc4OTcsImV4cCI6MjA5NjM2Mzg5N30.xSoTuoVNRZ2Jj0LW6vig4qbRABJpjjMBT5W136eT_I4" >> .env

# Show Supabase URL
echo "\n=== Supabase Configuration ==="
cat .env
echo "\n=== URLs to Test ==="

# Start local server
echo "\n🚀 Starting local development server..."
echo "📱 Access at: http://localhost:8080"
echo "🔧 Open Developer Tools to monitor for JavaScript errors"
echo "\nPress Ctrl+C to stop server"

python3 -m http.server 8080
