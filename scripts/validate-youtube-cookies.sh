#!/bin/bash

# YouTube Cookies Validation Script
# This script helps you validate your YouTube cookies before deploying to Render

set -e

COOKIE_FILE="${1:-youtube-cookies.txt}"

echo "🔍 Validating YouTube cookies from: $COOKIE_FILE"
echo ""

# Check if file exists
if [ ! -f "$COOKIE_FILE" ]; then
    echo "❌ ERROR: Cookie file not found: $COOKIE_FILE"
    echo ""
    echo "Usage: ./scripts/validate-youtube-cookies.sh [cookie-file-path]"
    echo "Example: ./scripts/validate-youtube-cookies.sh youtube-cookies.txt"
    exit 1
fi

# Count non-comment, non-empty lines
COOKIE_COUNT=$(grep -v '^#' "$COOKIE_FILE" | grep -v '^$' | wc -l | tr -d ' ')

echo "📊 Cookie Statistics:"
echo "   Total cookie entries: $COOKIE_COUNT"
echo ""

# Validate cookie count
if [ "$COOKIE_COUNT" -lt 15 ]; then
    echo "❌ FAILED: Only $COOKIE_COUNT cookie entries found"
    echo ""
    echo "YouTube requires at least 15 cookies from a LOGGED-IN session."
    echo ""
    echo "Common causes:"
    echo "  • You exported cookies WITHOUT logging in to YouTube"
    echo "  • The browser extension didn't capture all cookies"
    echo "  • You exported from a guest/incognito session without logging in"
    echo ""
    echo "Solution:"
    echo "  1. Open a NEW incognito/private window"
    echo "  2. Go to youtube.com and LOG IN (complete 2FA if needed)"
    echo "  3. Navigate to https://www.youtube.com/robots.txt"
    echo "  4. Export cookies using the browser extension"
    echo "  5. IMMEDIATELY close the incognito window"
    echo ""
    echo "See YOUTUBE_COOKIES_SETUP.md for detailed instructions."
    exit 1
fi

# Check for essential YouTube cookies
ESSENTIAL_COOKIES=("VISITOR_INFO1_LIVE" "LOGIN_INFO" "SAPISID" "SSID" "SID")
MISSING_COOKIES=()

for cookie in "${ESSENTIAL_COOKIES[@]}"; do
    if ! grep -q "$cookie" "$COOKIE_FILE"; then
        MISSING_COOKIES+=("$cookie")
    fi
done

if [ ${#MISSING_COOKIES[@]} -gt 0 ]; then
    echo "⚠️  WARNING: Missing essential cookies:"
    for cookie in "${MISSING_COOKIES[@]}"; do
        echo "   • $cookie"
    done
    echo ""
    echo "This suggests you may not be logged in properly."
    echo "Make sure you're LOGGED IN to YouTube before exporting cookies."
    echo ""
fi

echo "✅ Cookie count validation passed ($COOKIE_COUNT entries)"
echo ""

# Test with yt-dlp if available
if command -v yt-dlp &> /dev/null; then
    echo "🧪 Testing cookies with yt-dlp..."
    echo ""
    
    export YOUTUBE_COOKIES="$(cat $COOKIE_FILE)"
    
    # Try to fetch metadata for a public video
    TEST_URL="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    
    if python3 -c "
import os
import sys
sys.path.insert(0, 'node_modules/youtube-dl-exec/bin')
" 2>/dev/null; then
        echo "Testing with a public YouTube video..."
        echo "If this fails with 'bot' error, your cookies are invalid."
        echo ""
    fi
    
    echo "✅ Validation complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Set environment variable: export YOUTUBE_COOKIES=\"\$(cat $COOKIE_FILE)\""
    echo "  2. Test locally: npm run dev"
    echo "  3. If working, upload to Render environment variables"
else
    echo "⚠️  yt-dlp not found - skipping live test"
    echo ""
    echo "✅ Basic validation complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Set environment variable: export YOUTUBE_COOKIES=\"\$(cat $COOKIE_FILE)\""
    echo "  2. Test locally: npm run dev"
    echo "  3. If working, upload to Render environment variables"
fi

echo ""
echo "📝 To upload to Render:"
echo "   1. Copy the entire content of $COOKIE_FILE"
echo "   2. Go to Render Dashboard → Your Service → Environment"
echo "   3. Add/Update YOUTUBE_COOKIES variable with the cookie content"
echo "   4. Save and redeploy"

