#!/bin/bash
# legitimacy-check.sh - Automated legitimacy scoring for hackathon projects
# Usage: ./legitimacy-check.sh <repo-dir>

set -e

REPO=$1

if [ -z "$REPO" ]; then
    echo "Usage: $0 <repo-directory>"
    exit 1
fi

if [ ! -d "$REPO" ]; then
    echo "Error: Directory $REPO does not exist"
    exit 1
fi

cd "$REPO" || exit 1
REPO_NAME=$(basename "$REPO")

echo "=============================================="
echo "LEGITIMACY CHECK: $REPO_NAME"
echo "=============================================="
echo ""

# Initialize scores
CODE_QUALITY=0
GIT_HISTORY=0
TECHNICAL_DEPTH=0
DOCUMENTATION=0
COMPLETENESS=0
RED_FLAGS=0

# ============================================
# 1. CODE QUALITY (30 points max)
# ============================================
echo "## 1. CODE QUALITY (30 points max)"
echo ""

# 1.1 Formatting config (including new ESLint flat config)
HAS_ESLINT=$(ls .eslintrc* eslint.config.* 2>/dev/null | wc -l | tr -d ' ')
HAS_PRETTIER=$(ls .prettierrc* prettier.config.* 2>/dev/null | wc -l | tr -d ' ')
HAS_RUSTFMT=$(ls rustfmt.toml .rustfmt.toml 2>/dev/null | wc -l | tr -d ' ')
HAS_BIOME=$(ls biome.json 2>/dev/null | wc -l | tr -d ' ')
HAS_EDITORCONFIG=$(ls .editorconfig 2>/dev/null | wc -l | tr -d ' ')

FORMATTING_CONFIG=$((HAS_ESLINT + HAS_PRETTIER + HAS_RUSTFMT + HAS_BIOME + HAS_EDITORCONFIG))
if [ "$FORMATTING_CONFIG" -gt 0 ]; then
    echo "  [+2] Formatting config found"
    CODE_QUALITY=$((CODE_QUALITY + 2))
else
    echo "  [0] No formatting config"
fi

# 1.1b Substantial codebase (not just boilerplate)
TS_FILES=$(find . -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
RS_FILES=$(find . -name "*.rs" 2>/dev/null | wc -l | tr -d ' ')
TOTAL_CODE_FILES=$((TS_FILES + RS_FILES))
if [ "$TOTAL_CODE_FILES" -gt 50 ]; then
    echo "  [+3] Substantial codebase ($TOTAL_CODE_FILES source files)"
    CODE_QUALITY=$((CODE_QUALITY + 3))
elif [ "$TOTAL_CODE_FILES" -gt 20 ]; then
    echo "  [+2] Moderate codebase ($TOTAL_CODE_FILES source files)"
    CODE_QUALITY=$((CODE_QUALITY + 2))
elif [ "$TOTAL_CODE_FILES" -gt 10 ]; then
    echo "  [+1] Small codebase ($TOTAL_CODE_FILES source files)"
    CODE_QUALITY=$((CODE_QUALITY + 1))
else
    echo "  [0] Minimal codebase ($TOTAL_CODE_FILES source files)"
fi

# 1.2 TypeScript strict mode
if [ -f "tsconfig.json" ]; then
    if grep -q '"strict": true' tsconfig.json 2>/dev/null; then
        echo "  [+2] TypeScript strict mode enabled"
        CODE_QUALITY=$((CODE_QUALITY + 2))
    else
        echo "  [0] TypeScript not strict"
    fi
fi

# 1.3 Any abuse (TypeScript)
ANY_COUNT=$(grep -r ': any' --include='*.ts' --include='*.tsx' 2>/dev/null | wc -l | tr -d ' ')
if [ "$ANY_COUNT" -lt 5 ]; then
    echo "  [+2] Minimal 'any' usage ($ANY_COUNT occurrences)"
    CODE_QUALITY=$((CODE_QUALITY + 2))
elif [ "$ANY_COUNT" -lt 15 ]; then
    echo "  [+1] Moderate 'any' usage ($ANY_COUNT occurrences)"
    CODE_QUALITY=$((CODE_QUALITY + 1))
else
    echo "  [0] Excessive 'any' usage ($ANY_COUNT occurrences)"
fi

# 1.4 Unwrap abuse (Rust)
UNWRAP_COUNT=$(grep -r '\.unwrap()' --include='*.rs' 2>/dev/null | wc -l | tr -d ' ')
if [ "$UNWRAP_COUNT" -lt 10 ]; then
    echo "  [+2] Proper error handling in Rust ($UNWRAP_COUNT unwraps)"
    CODE_QUALITY=$((CODE_QUALITY + 2))
elif [ "$UNWRAP_COUNT" -lt 30 ]; then
    echo "  [+1] Moderate unwrap usage ($UNWRAP_COUNT)"
    CODE_QUALITY=$((CODE_QUALITY + 1))
else
    echo "  [0] Excessive unwrap() usage ($UNWRAP_COUNT)"
fi

# 1.5 File organization
LARGE_FILES=$(find . -name "*.ts" -o -name "*.rs" -o -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | awk '$1 > 500 {print}' | grep -v total | wc -l | tr -d ' ')
if [ "$LARGE_FILES" -eq 0 ]; then
    echo "  [+2] No god files (>500 lines)"
    CODE_QUALITY=$((CODE_QUALITY + 2))
else
    echo "  [0] Found $LARGE_FILES large files (>500 lines)"
fi

# 1.6 CI/CD
if [ -d ".github/workflows" ] && ls .github/workflows/*.yml 2>/dev/null | head -1 | grep -q .; then
    echo "  [+2] CI/CD configured"
    CODE_QUALITY=$((CODE_QUALITY + 2))
else
    echo "  [0] No CI/CD"
fi

# 1.7 Modern UI component library (shadcn, radix, chakra)
if [ -f "package.json" ]; then
    MODERN_UI=$(grep -c "@radix-ui\|shadcn\|@chakra-ui\|@mantine" package.json 2>/dev/null || echo 0)
    if [ "$MODERN_UI" -gt 0 ]; then
        echo "  [+2] Modern UI component library"
        CODE_QUALITY=$((CODE_QUALITY + 2))
    fi
fi

echo ""
echo "  Code Quality Score: $CODE_QUALITY/30"
echo ""

# ============================================
# 2. GIT HISTORY (20 points max)
# ============================================
echo "## 2. GIT HISTORY (20 points max)"
echo ""

if [ -d ".git" ]; then
    # Check if shallow clone
    IS_SHALLOW=$(git rev-parse --is-shallow-repository 2>/dev/null || echo "false")

    TOTAL_COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo 0)
    CONTRIBUTORS=$(git shortlog -sn 2>/dev/null | wc -l | tr -d ' ')
    DAYS_ACTIVE=$(git log --format='%ad' --date=short 2>/dev/null | sort -u | wc -l | tr -d ' ')
    LAST_24H_COMMITS=$(git log --since='24 hours ago' --oneline 2>/dev/null | wc -l | tr -d ' ')

    echo "  Total commits: $TOTAL_COMMITS"
    echo "  Contributors: $CONTRIBUTORS"
    echo "  Days active: $DAYS_ACTIVE"
    echo "  Last 24hr commits: $LAST_24H_COMMITS"

    if [ "$IS_SHALLOW" = "true" ]; then
        echo "  NOTE: Shallow clone detected - git history scoring limited"
        echo "  Awarding baseline git history points for shallow clones"
        GIT_HISTORY=$((GIT_HISTORY + 8))  # Baseline for shallow clones
    fi
    echo ""

    # 2.1 Commit count (skip for shallow clones)
    if [ "$IS_SHALLOW" != "true" ]; then
        if [ "$TOTAL_COMMITS" -gt 30 ]; then
            echo "  [+3] Good commit count (>30)"
            GIT_HISTORY=$((GIT_HISTORY + 3))
        elif [ "$TOTAL_COMMITS" -gt 10 ]; then
            echo "  [+2] Moderate commit count (10-30)"
            GIT_HISTORY=$((GIT_HISTORY + 2))
        else
            echo "  [0] Low commit count (<10)"
        fi

        # 2.2 Development spread
        if [ "$DAYS_ACTIVE" -gt 7 ]; then
            echo "  [+4] Development over multiple days (>7)"
            GIT_HISTORY=$((GIT_HISTORY + 4))
        elif [ "$DAYS_ACTIVE" -gt 3 ]; then
            echo "  [+2] Development over a few days (3-7)"
            GIT_HISTORY=$((GIT_HISTORY + 2))
        else
            echo "  [0] All commits in 1-2 days"
        fi

        # 2.3 Last-minute rush check
        if [ "$LAST_24H_COMMITS" -gt 20 ] && [ "$TOTAL_COMMITS" -lt 40 ]; then
            echo "  [-3] Suspicious last-minute rush"
            GIT_HISTORY=$((GIT_HISTORY - 3))
        fi
    fi

    # 2.4 Commit message quality (sample check)
    BAD_MESSAGES=$(git log --oneline -20 2>/dev/null | grep -iE '^[a-f0-9]+ (fix|update|wip|test|asdf|changes|stuff)$' | wc -l | tr -d ' ')
    if [ "$BAD_MESSAGES" -lt 3 ]; then
        echo "  [+3] Good commit messages"
        GIT_HISTORY=$((GIT_HISTORY + 3))
    else
        echo "  [0] Poor commit messages ($BAD_MESSAGES bad)"
    fi

    # 2.5 AI-generated commit messages
    AI_MESSAGES=$(git log --oneline -30 2>/dev/null | grep -iE '(refactor.*for better|improve.*quality|implement.*robust|comprehensive|enhance.*functionality)' | wc -l | tr -d ' ')
    if [ "$AI_MESSAGES" -gt 3 ]; then
        echo "  [-2] Likely AI-generated commit messages"
        GIT_HISTORY=$((GIT_HISTORY - 2))
    fi
else
    echo "  [0] No git repository"
fi

echo ""
echo "  Git History Score: $GIT_HISTORY/20"
echo ""

# ============================================
# 3. TECHNICAL DEPTH (27 points max)
# ============================================
echo "## 3. TECHNICAL DEPTH (27 points max)"
echo ""

# 3.1 ZK Circuits (source or compiled)
CIRCOM_FILES=$(find . -name "*.circom" 2>/dev/null | wc -l | tr -d ' ')
NOIR_FILES=$(find . -name "*.nr" 2>/dev/null | wc -l | tr -d ' ')
NARGO_TOML=$(find . -name "Nargo.toml" 2>/dev/null | wc -l | tr -d ' ')
# Also check for compiled ZK artifacts (WASM, zkey, verifier)
ZK_WASM=$(find . -name "*.wasm" 2>/dev/null | grep -i "circuit\|withdraw\|deposit\|proof\|verif" | wc -l | tr -d ' ')
ZK_ZKEY=$(find . -name "*.zkey" 2>/dev/null | wc -l | tr -d ' ')
ZK_VERIFIER=$(find . -name "*verifier*" -name "*.sol" -o -name "*verifier*" -name "*.rs" 2>/dev/null | wc -l | tr -d ' ')

ZK_SOURCE=$((CIRCOM_FILES + NOIR_FILES + NARGO_TOML))
ZK_COMPILED=$((ZK_WASM + ZK_ZKEY + ZK_VERIFIER))

if [ "$ZK_SOURCE" -gt 0 ]; then
    echo "  [+4] ZK circuit sources found (circom: $CIRCOM_FILES, noir: $NOIR_FILES)"
    TECHNICAL_DEPTH=$((TECHNICAL_DEPTH + 4))

    # Check if circuits have actual constraints
    if [ "$NOIR_FILES" -gt 0 ]; then
        CONSTRAINTS=$(grep -r "assert\|constrain" --include="*.nr" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$CONSTRAINTS" -gt 5 ]; then
            echo "  [+2] Circuits have real constraints ($CONSTRAINTS)"
            TECHNICAL_DEPTH=$((TECHNICAL_DEPTH + 2))
        fi
    fi
elif [ "$ZK_COMPILED" -gt 0 ]; then
    echo "  [+3] Compiled ZK artifacts found (wasm: $ZK_WASM, zkey: $ZK_ZKEY)"
    TECHNICAL_DEPTH=$((TECHNICAL_DEPTH + 3))
else
    echo "  [0] No ZK circuits"
fi

# 3.2 Anchor Programs
ANCHOR_PROGRAMS=$(find . -path "*/programs/*/src/lib.rs" 2>/dev/null | wc -l | tr -d ' ')
if [ "$ANCHOR_PROGRAMS" -gt 0 ]; then
    echo "  [+4] Anchor programs found ($ANCHOR_PROGRAMS)"
    TECHNICAL_DEPTH=$((TECHNICAL_DEPTH + 4))

    # Check for proper account validation
    CONSTRAINTS=$(grep -r "#\[account(" --include="*.rs" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$CONSTRAINTS" -gt 3 ]; then
        echo "  [+2] Proper account constraints ($CONSTRAINTS)"
        TECHNICAL_DEPTH=$((TECHNICAL_DEPTH + 2))
    fi
else
    # Check for pinocchio
    PINOCCHIO=$(grep -r "pinocchio" Cargo.toml 2>/dev/null | wc -l | tr -d ' ')
    if [ "$PINOCCHIO" -gt 0 ]; then
        echo "  [+3] Pinocchio program found"
        TECHNICAL_DEPTH=$((TECHNICAL_DEPTH + 3))
    else
        echo "  [0] No Solana programs"
    fi
fi

# 3.3 Crypto primitives
POSEIDON=$(grep -ri "poseidon" --include="*.rs" --include="*.ts" --include="*.nr" 2>/dev/null | wc -l | tr -d ' ')
PEDERSEN=$(grep -ri "pedersen" --include="*.rs" --include="*.ts" --include="*.nr" 2>/dev/null | wc -l | tr -d ' ')
CRYPTO_PRIMITIVES=$((POSEIDON + PEDERSEN))
if [ "$CRYPTO_PRIMITIVES" -gt 0 ]; then
    echo "  [+3] Proper crypto primitives (poseidon: $POSEIDON, pedersen: $PEDERSEN)"
    TECHNICAL_DEPTH=$((TECHNICAL_DEPTH + 3))
fi

# 3.4 Browser ZK proof generation (snarkjs/circomlibjs)
SNARKJS=$(grep -ri "snarkjs\|groth16" --include="*.ts" --include="*.tsx" --include="package.json" 2>/dev/null | wc -l | tr -d ' ')
CIRCOMLIB=$(grep -ri "circomlibjs\|circomlib" --include="*.ts" --include="*.tsx" --include="package.json" 2>/dev/null | wc -l | tr -d ' ')
if [ "$SNARKJS" -gt 0 ] || [ "$CIRCOMLIB" -gt 0 ]; then
    echo "  [+4] Browser ZK proof generation (snarkjs: $SNARKJS, circomlib: $CIRCOMLIB)"
    TECHNICAL_DEPTH=$((TECHNICAL_DEPTH + 4))
fi

# 3.5 Light Protocol / ZK Compression
LIGHT_PROTOCOL=$(grep -ri "@lightprotocol\|light-protocol\|zk.compression" --include="*.ts" --include="*.tsx" --include="package.json" 2>/dev/null | wc -l | tr -d ' ')
if [ "$LIGHT_PROTOCOL" -gt 0 ]; then
    echo "  [+3] Light Protocol / ZK compression ($LIGHT_PROTOCOL references)"
    TECHNICAL_DEPTH=$((TECHNICAL_DEPTH + 3))
fi

echo ""
echo "  Technical Depth Score: $TECHNICAL_DEPTH/27"
echo ""

# ============================================
# 4. DOCUMENTATION (19 points max)
# ============================================
echo "## 4. DOCUMENTATION (19 points max)"
echo ""

# 4.1 README quality
if [ -f "README.md" ]; then
    README_LINES=$(wc -l < README.md | tr -d ' ')

    # Check if it's boilerplate
    IS_BOILERPLATE=$(grep -c "This project was bootstrapped\|Create React App\|Getting Started with\|npx create-" README.md 2>/dev/null || echo 0)

    if [ "$IS_BOILERPLATE" -gt 0 ]; then
        echo "  [0] README is boilerplate"
    elif [ "$README_LINES" -gt 100 ]; then
        echo "  [+4] Comprehensive README ($README_LINES lines)"
        DOCUMENTATION=$((DOCUMENTATION + 4))
    elif [ "$README_LINES" -gt 30 ]; then
        echo "  [+2] Basic README ($README_LINES lines)"
        DOCUMENTATION=$((DOCUMENTATION + 2))
    else
        echo "  [+1] Minimal README ($README_LINES lines)"
        DOCUMENTATION=$((DOCUMENTATION + 1))
    fi

    # Check for architecture/how it works
    if grep -qi "architecture\|how it works\|design\|overview" README.md 2>/dev/null; then
        echo "  [+2] Architecture documentation"
        DOCUMENTATION=$((DOCUMENTATION + 2))
    fi

    # Check for setup instructions
    if grep -qi "install\|setup\|getting started\|quick start" README.md 2>/dev/null; then
        echo "  [+2] Setup instructions"
        DOCUMENTATION=$((DOCUMENTATION + 2))
    fi

    # 4.1b Professional README presentation (badges, tables, links)
    BADGE_COUNT=$(grep -c "img.shields.io\|badge\|!\[" README.md 2>/dev/null || echo 0)
    if [ "$BADGE_COUNT" -gt 2 ]; then
        echo "  [+2] Professional badges ($BADGE_COUNT)"
        DOCUMENTATION=$((DOCUMENTATION + 2))
    fi

    # Check for live demo/deployment link
    if grep -qiE "https?://[a-z0-9.-]+\.(xyz|app|io|dev|com|org)" README.md 2>/dev/null; then
        if grep -qi "live\|demo\|deploy" README.md 2>/dev/null; then
            echo "  [+2] Live demo/deployment linked"
            DOCUMENTATION=$((DOCUMENTATION + 2))
        fi
    fi
else
    echo "  [0] No README"
fi

# 4.2 Code comments (not excessive)
COMMENT_RATIO=$(find . -name "*.ts" -o -name "*.rs" 2>/dev/null | head -10 | xargs grep -c "^[[:space:]]*//" 2>/dev/null | awk -F: '{sum+=$2} END {print sum+0}')
CODE_LINES=$(find . -name "*.ts" -o -name "*.rs" 2>/dev/null | head -10 | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
if [ "$CODE_LINES" -gt 0 ]; then
    RATIO=$((COMMENT_RATIO * 100 / CODE_LINES))
    if [ "$RATIO" -gt 5 ] && [ "$RATIO" -lt 30 ]; then
        echo "  [+2] Reasonable comment ratio ($RATIO%)"
        DOCUMENTATION=$((DOCUMENTATION + 2))
    fi
fi

echo ""
echo "  Documentation Score: $DOCUMENTATION/19"
echo ""

# ============================================
# 5. COMPLETENESS (17 points max)
# ============================================
echo "## 5. COMPLETENESS (17 points max)"
echo ""

# 5.1 Tests exist (unit tests)
TEST_FILES=$(find . -name "*.test.*" -o -name "*.spec.*" -o -name "*_test.rs" 2>/dev/null | wc -l | tr -d ' ')
if [ "$TEST_FILES" -gt 5 ]; then
    echo "  [+3] Good test coverage ($TEST_FILES test files)"
    COMPLETENESS=$((COMPLETENESS + 3))
elif [ "$TEST_FILES" -gt 0 ]; then
    echo "  [+1] Some tests ($TEST_FILES test files)"
    COMPLETENESS=$((COMPLETENESS + 1))
else
    echo "  [0] No unit tests"
fi

# 5.1b E2E/Integration tests
E2E_FILES=$(find . -name "*e2e*" -o -name "*integration*" -o -name "playwright*" -o -name "cypress*" 2>/dev/null | wc -l | tr -d ' ')
if [ "$E2E_FILES" -gt 0 ]; then
    echo "  [+2] E2E/integration tests found ($E2E_FILES)"
    COMPLETENESS=$((COMPLETENESS + 2))
fi

# 5.2 Dependencies defined
if [ -f "package.json" ] || [ -f "Cargo.toml" ]; then
    echo "  [+2] Dependencies defined"
    COMPLETENESS=$((COMPLETENESS + 2))
fi

# 5.3 Anchor.toml with program IDs
if [ -f "Anchor.toml" ]; then
    PROGRAM_IDS=$(grep -E "^[a-zA-Z_]+ = \"[1-9A-HJ-NP-Za-km-z]{32,44}\"" Anchor.toml 2>/dev/null | wc -l | tr -d ' ')
    if [ "$PROGRAM_IDS" -gt 0 ]; then
        echo "  [+3] Deployed program IDs found ($PROGRAM_IDS)"
        COMPLETENESS=$((COMPLETENESS + 3))
    fi
fi

# 5.4 Demo video link
if grep -qriE "(youtube|youtu\.be|loom|vimeo|demo.*video)" README.md 2>/dev/null; then
    echo "  [+3] Demo video linked"
    COMPLETENESS=$((COMPLETENESS + 3))
else
    echo "  [0] No demo video"
fi

echo ""
echo "  Completeness Score: $COMPLETENESS/17"
echo ""

# ============================================
# 6. RED FLAGS (deductions)
# ============================================
echo "## 6. RED FLAGS (deductions)"
echo ""

# 6.1 TODO spam
TODO_COUNT=$(grep -r "TODO\|FIXME\|XXX\|HACK" --include="*.rs" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$TODO_COUNT" -gt 15 ]; then
    echo "  [-3] Excessive TODOs ($TODO_COUNT)"
    RED_FLAGS=$((RED_FLAGS - 3))
elif [ "$TODO_COUNT" -gt 8 ]; then
    echo "  [-1] Many TODOs ($TODO_COUNT)"
    RED_FLAGS=$((RED_FLAGS - 1))
fi

# 6.2 Hardcoded secrets
HARDCODED=$(grep -rE "(secret|private|key|password)\s*[:=]\s*[\"'][A-Za-z0-9]{20,}" --include="*.ts" --include="*.rs" --include="*.env*" 2>/dev/null | grep -v "example\|sample\|test" | wc -l | tr -d ' ')
if [ "$HARDCODED" -gt 0 ]; then
    echo "  [-5] Hardcoded secrets found ($HARDCODED)"
    RED_FLAGS=$((RED_FLAGS - 5))
fi

# 6.3 Fake crypto
XOR_CRYPTO=$(grep -ri "xor\|XOR" --include="*.rs" --include="*.ts" 2>/dev/null | grep -i "encrypt\|crypt" | wc -l | tr -d ' ')
if [ "$XOR_CRYPTO" -gt 0 ]; then
    echo "  [-5] XOR 'encryption' found"
    RED_FLAGS=$((RED_FLAGS - 5))
fi

# 6.4 Mock/simulated
MOCK_COUNT=$(grep -ri "mock\|simulated\|fake\|placeholder" --include="*.rs" --include="*.ts" 2>/dev/null | grep -v "test\|spec" | wc -l | tr -d ' ')
if [ "$MOCK_COUNT" -gt 10 ]; then
    echo "  [-3] Excessive mock/simulated code ($MOCK_COUNT)"
    RED_FLAGS=$((RED_FLAGS - 3))
fi

# 6.5 Empty functions (exclude test files and intentional no-ops)
EMPTY_FN=$(grep -rE "function\s+\w+\s*\([^)]*\)\s*\{\s*\}" --include="*.rs" --include="*.ts" 2>/dev/null | grep -v "test\|spec\|mock" | wc -l | tr -d ' ')
# Also check for TODO/unimplemented in function bodies
TODO_IMPL=$(grep -rE "(TODO|FIXME|unimplemented|not implemented)" --include="*.rs" --include="*.ts" 2>/dev/null | grep -i "function\|fn \|impl" | wc -l | tr -d ' ')
STUB_TOTAL=$((EMPTY_FN + TODO_IMPL))
if [ "$STUB_TOTAL" -gt 10 ]; then
    echo "  [-2] Empty/stub functions ($STUB_TOTAL)"
    RED_FLAGS=$((RED_FLAGS - 2))
fi

echo ""
echo "  Red Flags Score: $RED_FLAGS"
echo ""

# ============================================
# FINAL SCORE (max 113 points before red flags)
# ============================================
TOTAL=$((CODE_QUALITY + GIT_HISTORY + TECHNICAL_DEPTH + DOCUMENTATION + COMPLETENESS + RED_FLAGS))

# Normalize to 100-point scale for classification
MAX_POSITIVE=113
NORMALIZED=$((TOTAL * 100 / MAX_POSITIVE))
if [ "$NORMALIZED" -gt 100 ]; then NORMALIZED=100; fi
if [ "$NORMALIZED" -lt 0 ]; then NORMALIZED=0; fi

echo "=============================================="
echo "FINAL SCORE: $TOTAL (normalized: $NORMALIZED/100)"
echo "=============================================="
echo ""
echo "Breakdown:"
echo "  Code Quality:    $CODE_QUALITY/30"
echo "  Git History:     $GIT_HISTORY/20"
echo "  Technical Depth: $TECHNICAL_DEPTH/27"
echo "  Documentation:   $DOCUMENTATION/19"
echo "  Completeness:    $COMPLETENESS/17"
echo "  Red Flags:       $RED_FLAGS"
echo ""

if [ "$NORMALIZED" -ge 70 ]; then
    CLASSIFICATION="POLISHED"
    echo "Classification: POLISHED - Production-quality, clearly legitimate"
elif [ "$NORMALIZED" -ge 55 ]; then
    CLASSIFICATION="SOLID"
    echo "Classification: SOLID - Good effort, some rough edges"
elif [ "$NORMALIZED" -ge 40 ]; then
    CLASSIFICATION="BASIC"
    echo "Classification: BASIC - Functional but minimal polish"
elif [ "$NORMALIZED" -ge 25 ]; then
    CLASSIFICATION="ROUGH"
    echo "Classification: ROUGH - Questionable effort/understanding"
else
    CLASSIFICATION="VIBE_CODED"
    echo "Classification: VIBE CODED - Likely AI-generated or copy-pasted"
fi

# Output JSON for programmatic use
echo ""
echo "JSON:"
cat << EOF
{
  "repo": "$REPO_NAME",
  "total_score": $TOTAL,
  "normalized_score": $NORMALIZED,
  "code_quality": $CODE_QUALITY,
  "git_history": $GIT_HISTORY,
  "technical_depth": $TECHNICAL_DEPTH,
  "documentation": $DOCUMENTATION,
  "completeness": $COMPLETENESS,
  "red_flags": $RED_FLAGS,
  "classification": "$CLASSIFICATION"
}
EOF
