#!/bin/bash
# Security Audit - Static analysis and vulnerability checks
set -e
cd "$(dirname "$0")/.."

echo "🔒 Running security audit..."

# 1. Cargo audit
if command -v cargo &> /dev/null; then
    cargo audit 2>&1 || echo "⚠️ Vulnerabilities found"
    cargo clippy -- -D warnings 2>&1 || echo "⚠️ Clippy issues"
    cargo fmt --check 2>&1 || echo "⚠️ Format issues"
fi

# 2. NPM audit
[ -f "package.json" ] && npm audit --audit-level=high 2>&1 || true

# 3. Secret detection
echo "Scanning for secrets..."
grep -rE "(private_key|secret_key|api_key)" --include="*.rs" . 2>/dev/null && echo "⚠️ Secrets found" || echo "✓ No secrets"

# 4. Unsafe code
UNSAFE=$(grep -r "unsafe" --include="*.rs" . 2>/dev/null | wc -l)
echo "Unsafe blocks: $UNSAFE"

echo "✓ Security audit completed"
