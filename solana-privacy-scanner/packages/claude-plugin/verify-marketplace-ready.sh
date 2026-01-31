#!/bin/bash

# Verification script for marketplace distribution readiness

set -e

echo "🔍 Verifying Claude Code Marketplace Distribution Readiness"
echo "==========================================================="
echo ""

# Track overall status
ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

error() {
    echo -e "${RED}✗ ERROR: $1${NC}"
    ((ERRORS++))
}

warning() {
    echo -e "${YELLOW}⚠ WARNING: $1${NC}"
    ((WARNINGS++))
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

info() {
    echo "ℹ $1"
}

# Change to repository root (go up 2 directories from packages/claude-plugin)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../.."

echo "📁 Checking file structure..."
echo ""

# Check marketplace.json exists
if [ -f ".claude-plugin/marketplace.json" ]; then
    success "Marketplace file exists: .claude-plugin/marketplace.json"
else
    error "Marketplace file not found: .claude-plugin/marketplace.json"
fi

# Check plugin.json exists
if [ -f "packages/claude-plugin/.claude-plugin/plugin.json" ]; then
    success "Plugin manifest exists: packages/claude-plugin/.claude-plugin/plugin.json"
else
    error "Plugin manifest not found: packages/claude-plugin/.claude-plugin/plugin.json"
fi

# Check skills directory
if [ -d "packages/claude-plugin/skills" ]; then
    success "Skills directory exists"
    SKILL_COUNT=$(find packages/claude-plugin/skills -name "SKILL.md" | wc -l | tr -d ' ')
    info "  Found $SKILL_COUNT skill(s)"
else
    error "Skills directory not found"
fi

# Check dist directory
if [ -d "packages/claude-plugin/dist" ]; then
    success "Dist directory exists"
    JS_COUNT=$(find packages/claude-plugin/dist -name "*.js" | wc -l | tr -d ' ')
    if [ "$JS_COUNT" -gt 0 ]; then
        success "  Found $JS_COUNT compiled JavaScript file(s)"
    else
        warning "  No JavaScript files in dist/ - run 'npm run build'"
    fi
else
    error "Dist directory not found - run 'npm run build'"
fi

echo ""
echo "📝 Checking JSON syntax..."
echo ""

# Validate marketplace.json syntax
if command -v jq &> /dev/null; then
    if jq empty .claude-plugin/marketplace.json 2>/dev/null; then
        success "marketplace.json is valid JSON"

        # Check required fields
        NAME=$(jq -r '.name' .claude-plugin/marketplace.json)
        OWNER=$(jq -r '.owner.name' .claude-plugin/marketplace.json)
        PLUGIN_COUNT=$(jq '.plugins | length' .claude-plugin/marketplace.json)

        if [ "$NAME" != "null" ]; then
            success "  Marketplace name: $NAME"
        else
            error "  Missing marketplace name"
        fi

        if [ "$OWNER" != "null" ]; then
            success "  Owner: $OWNER"
        else
            error "  Missing owner name"
        fi

        success "  Contains $PLUGIN_COUNT plugin(s)"
    else
        error "marketplace.json has invalid JSON syntax"
    fi

    # Validate plugin.json syntax
    if jq empty packages/claude-plugin/.claude-plugin/plugin.json 2>/dev/null; then
        success "plugin.json is valid JSON"

        PLUGIN_NAME=$(jq -r '.name' packages/claude-plugin/.claude-plugin/plugin.json)
        PLUGIN_VERSION=$(jq -r '.version' packages/claude-plugin/.claude-plugin/plugin.json)

        if [ "$PLUGIN_NAME" != "null" ]; then
            success "  Plugin name: $PLUGIN_NAME"
        else
            error "  Missing plugin name"
        fi

        if [ "$PLUGIN_VERSION" != "null" ]; then
            success "  Plugin version: $PLUGIN_VERSION"
        else
            warning "  Plugin version not set"
        fi
    else
        error "plugin.json has invalid JSON syntax"
    fi
else
    warning "jq not installed - skipping JSON validation"
    info "  Install jq for JSON validation: brew install jq"
fi

echo ""
echo "🔧 Checking build setup..."
echo ""

# Check if node_modules exists
if [ -d "packages/claude-plugin/node_modules" ]; then
    success "Dependencies installed"
else
    warning "Dependencies not installed - run 'npm install'"
fi

# Check if package.json exists
if [ -f "packages/claude-plugin/package.json" ]; then
    success "package.json exists"

    # Check for build script
    if grep -q '"build"' packages/claude-plugin/package.json; then
        success "  Build script configured"
    else
        warning "  No build script found"
    fi
else
    error "package.json not found"
fi

echo ""
echo "📚 Checking documentation..."
echo ""

# Check for README
if [ -f "packages/claude-plugin/README.md" ]; then
    success "README.md exists"
else
    warning "README.md not found"
fi

# Check for marketplace install guide
if [ -f "packages/claude-plugin/MARKETPLACE_INSTALL.md" ]; then
    success "MARKETPLACE_INSTALL.md exists"
else
    warning "MARKETPLACE_INSTALL.md not found"
fi

echo ""
echo "🌐 Checking Git repository..."
echo ""

# Check if it's a git repo
if [ -d ".git" ]; then
    success "Git repository initialized"

    # Check for remote
    if git remote -v | grep -q origin; then
        REMOTE_URL=$(git remote get-url origin)
        success "  Git remote configured: $REMOTE_URL"

        # Check if it's GitHub
        if [[ "$REMOTE_URL" == *"github.com"* ]]; then
            success "  GitHub repository detected"

            # Extract owner/repo
            if [[ "$REMOTE_URL" =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
                OWNER="${BASH_REMATCH[1]}"
                REPO="${BASH_REMATCH[2]}"
                info "  Repository: $OWNER/$REPO"
                echo ""
                info "  Users will install with:"
                info "    /plugin marketplace add $OWNER/$REPO"
                info "    /plugin install solana-privacy-scanner@solana-privacy-scanner-marketplace"
            fi
        else
            warning "  Not a GitHub repository - marketplace requires GitHub"
        fi
    else
        error "  No git remote configured"
    fi

    # Check if there are uncommitted changes
    if git diff-index --quiet HEAD --; then
        success "  No uncommitted changes"
    else
        warning "  Uncommitted changes detected - commit before publishing"
    fi
else
    error "Not a git repository"
fi

echo ""
echo "==========================================================="
echo "📊 Summary"
echo "==========================================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to publish.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. cd packages/claude-plugin && npm run build"
    echo "2. claude plugin validate ."
    echo "3. Follow PUBLISH_TO_MARKETPLACE.md"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) - Review before publishing${NC}"
    echo ""
    echo "Address warnings if possible, then:"
    echo "1. cd packages/claude-plugin && npm run build"
    echo "2. claude plugin validate ."
    echo "3. Follow PUBLISH_TO_MARKETPLACE.md"
else
    echo -e "${RED}❌ $ERRORS error(s) found - Must fix before publishing${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS warning(s) also detected${NC}"
    fi
    echo ""
    echo "Fix the errors above, then run this script again."
    exit 1
fi

echo ""
