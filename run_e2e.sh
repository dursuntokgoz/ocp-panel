#!/bin/bash
# OCP Panel E2E Test Runner
# Usage: ./run_e2e.sh [test-file-or-pattern]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Script is already in project root
PROJECT_ROOT="$SCRIPT_DIR"
cd "$PROJECT_ROOT"

# Load password from config file
if [[ -f ~/.config/ocp-panel/password ]]; then
  export OCP_PASSWORD=$(cat ~/.config/ocp-panel/password)
else
  echo "ERROR: Password file not found at ~/.config/ocp-panel/password"
  exit 1
fi

export BASE_URL="https://192.168.1.2:2083"

echo "🧪 OCP Panel E2E Tests"
echo "   Base URL: $BASE_URL"
echo "   Password: ${OCP_PASSWORD:0:4}****"
echo ""

# Ensure Playwright browsers are installed
if ! npx playwright install chromium --dry-run 2>/dev/null | grep -q "already installed"; then
  echo "📦 Installing Playwright Chromium..."
  npx playwright install chromium --with-deps
fi

# Run tests
if [[ $# -eq 0 ]]; then
  echo "🚀 Running full test suite..."
  npx playwright test --config=tests/playwright.config.js
else
  echo "🚀 Running: $*"
  npx playwright test --config=tests/playwright.config.js "$@"
fi

EXIT_CODE=$?

echo ""
if [[ $EXIT_CODE -eq 0 ]]; then
  echo "✅ All tests passed!"
else
  echo "❌ Some tests failed (exit code: $EXIT_CODE)"
  echo "📊 Report: tests/report/index.html"
fi

exit $EXIT_CODE