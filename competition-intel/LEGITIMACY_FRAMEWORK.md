# Project Legitimacy & Polish Framework

A scoring system to identify genuine, well-crafted hackathon submissions vs. hastily assembled "vibe coded" projects.

## Scoring Overview

| Category | Max Points | Weight |
|----------|------------|--------|
| Code Quality | 25 | Critical |
| Git History | 20 | High |
| Technical Depth | 20 | High |
| Documentation | 15 | Medium |
| Completeness | 15 | Medium |
| Red Flags | -30 | Deductions |

**Total: 100 points (before deductions)**

### Classification

| Score | Classification | Interpretation |
|-------|----------------|----------------|
| 80-100 | **POLISHED** | Production-quality, clearly legitimate |
| 60-79 | **SOLID** | Good effort, some rough edges |
| 40-59 | **BASIC** | Functional but minimal polish |
| 20-39 | **ROUGH** | Questionable effort/understanding |
| 0-19 | **VIBE CODED** | Likely AI-generated or copy-pasted |

---

## 1. Code Quality (25 points)

### 1.1 Consistency (8 points)

```bash
# Check for linting/formatting config
ls {.eslintrc*,.prettierrc*,rustfmt.toml,clippy.toml,.editorconfig,biome.json} 2>/dev/null
```

| Signal | Points | Check |
|--------|--------|-------|
| Formatting config exists | +2 | `.prettierrc`, `rustfmt.toml`, etc. |
| Consistent naming conventions | +2 | Variables, functions follow same pattern |
| Consistent file organization | +2 | Similar files structured similarly |
| No mixed styles | +2 | Not mixing camelCase/snake_case randomly |

### 1.2 Error Handling (6 points)

| Signal | Points | Check |
|--------|--------|-------|
| Proper Result/Option usage (Rust) | +2 | No `.unwrap()` spam |
| Try-catch with specific errors | +2 | Not catching all errors generically |
| User-friendly error messages | +2 | Errors are actionable |

### 1.3 Type Safety (6 points)

| Signal | Points | Check |
|--------|--------|-------|
| TypeScript strict mode | +2 | `"strict": true` in tsconfig |
| No `any` abuse | +2 | `grep -r ": any"` count < 5 |
| Proper Rust typing | +2 | No excessive `as` casts |

### 1.4 Code Organization (5 points)

| Signal | Points | Check |
|--------|--------|-------|
| Logical module separation | +2 | Related code grouped together |
| No god files (>500 lines) | +2 | Files are focused |
| Clear public API | +1 | Exports are intentional |

---

## 2. Git History (20 points)

### 2.1 Commit Quality (10 points)

```bash
# Check recent commits
git log --oneline -30
```

| Signal | Points | Check |
|--------|--------|-------|
| Descriptive messages | +3 | Not "fix", "update", "wip", "asdf" |
| Conventional commits | +2 | `feat:`, `fix:`, `docs:` prefixes |
| Atomic commits | +3 | Each commit does one thing |
| No "AI slop" messages | +2 | Not "Refactor code for better maintainability" |

**AI Commit Message Red Flags:**
- "Refactor X for better Y"
- "Improve code quality"
- "Add comprehensive error handling"
- "Implement robust solution"
- Overly verbose explanations

### 2.2 Development Pattern (10 points)

```bash
# Check commit timeline
git log --format="%ai" | head -50
```

| Signal | Points | Check |
|--------|--------|-------|
| Steady progress over days | +4 | Not all commits in final 24hrs |
| Multiple work sessions | +3 | Gaps indicating real development |
| Iterative refinement | +3 | Bug fixes, improvements over time |

**Suspicious Patterns:**
- 50+ commits in final day
- All commits within 4-hour window
- Giant initial commit with everything

---

## 3. Technical Depth (20 points)

### 3.1 Privacy Implementation (10 points)

| Signal | Points | Check |
|--------|--------|-------|
| Real ZK circuits | +4 | Working .circom/.nr files with constraints |
| Proper crypto primitives | +3 | Poseidon, Pedersen used correctly |
| Security considerations | +3 | Nullifiers, double-spend prevention |

**Crypto Red Flags (deduct points):**
- XOR "encryption"
- Hardcoded keys/proofs
- `// TODO: add real encryption`
- Base64 encoding called "encryption"

### 3.2 Solana Integration (10 points)

| Signal | Points | Check |
|--------|--------|-------|
| Working Anchor program | +4 | Compiles, has instructions |
| Proper PDA usage | +2 | Seeds make sense |
| Account validation | +2 | Constraints are correct |
| CPI if needed | +2 | Cross-program calls work |

---

## 4. Documentation (15 points)

### 4.1 README Quality (8 points)

| Signal | Points | Check |
|--------|--------|-------|
| Clear problem statement | +2 | What does this solve? |
| Architecture explanation | +2 | How does it work? |
| Setup instructions | +2 | Can someone run this? |
| Not boilerplate | +2 | Custom content, not template |

**README Red Flags:**
- Default create-react-app README
- "This project was bootstrapped with..."
- Empty sections
- Lorem ipsum

### 4.2 Code Documentation (7 points)

| Signal | Points | Check |
|--------|--------|-------|
| Function docs where needed | +3 | Complex functions explained |
| Architecture docs | +2 | System design documented |
| API documentation | +2 | Endpoints/instructions documented |

---

## 5. Completeness (15 points)

### 5.1 Build Status (5 points)

```bash
# Try to build
npm install && npm run build  # or
anchor build  # or
cargo build
```

| Signal | Points | Check |
|--------|--------|-------|
| Builds successfully | +3 | No errors |
| No major warnings | +2 | Clean build output |

### 5.2 Test Coverage (5 points)

```bash
# Check for tests
find . -name "*.test.*" -o -name "*.spec.*" -o -name "*_test.rs" | wc -l
```

| Signal | Points | Check |
|--------|--------|-------|
| Tests exist | +2 | More than 0 test files |
| Tests pass | +2 | `npm test` / `anchor test` succeeds |
| Meaningful tests | +1 | Not just "it renders" |

### 5.3 Deployment (5 points)

| Signal | Points | Check |
|--------|--------|-------|
| Deployed to devnet | +3 | Program ID verifiable on-chain |
| Demo available | +2 | Live URL or video |

---

## 6. Red Flags (Deductions)

### 6.1 Vibe Coding Indicators (-15 max)

| Flag | Deduction | Detection |
|------|-----------|-----------|
| Excessive AI comments | -3 | "This function does X by Y" everywhere |
| TODO spam | -3 | `grep -r "TODO"` count > 10 |
| Placeholder implementations | -3 | `return null`, `pass`, empty functions |
| Hardcoded everything | -3 | No configuration, magic strings |
| Copy-paste code | -3 | Duplicate blocks with minor changes |

### 6.2 Fake/Mock Implementations (-15 max)

| Flag | Deduction | Detection |
|------|-----------|-----------|
| Mock crypto | -5 | XOR, base64, hardcoded proofs |
| Simulated blockchain | -5 | No real Solana interaction |
| Fake API responses | -5 | Hardcoded data, no real calls |

---

## Automated Checks Script

```bash
#!/bin/bash
# legitimacy-check.sh <repo-dir>

REPO=$1
cd "$REPO" || exit 1

echo "=== LEGITIMACY CHECK: $REPO ==="

# 1. Code Quality
echo -e "\n## Code Quality"
echo "Formatting config: $(ls .eslintrc* .prettierrc* rustfmt.toml 2>/dev/null | wc -l)"
echo "TypeScript strict: $(grep -l '"strict": true' tsconfig.json 2>/dev/null | wc -l)"
echo "Any abuse: $(grep -r ': any' --include='*.ts' --include='*.tsx' 2>/dev/null | wc -l)"
echo "Unwrap count: $(grep -r '\.unwrap()' --include='*.rs' 2>/dev/null | wc -l)"

# 2. Git History
echo -e "\n## Git History"
echo "Total commits: $(git rev-list --count HEAD 2>/dev/null || echo 0)"
echo "Contributors: $(git shortlog -sn 2>/dev/null | wc -l)"
echo "Days active: $(git log --format='%ad' --date=short 2>/dev/null | sort -u | wc -l)"
echo "Last 24hr commits: $(git log --since='24 hours ago' --oneline 2>/dev/null | wc -l)"

# 3. Technical
echo -e "\n## Technical Depth"
echo "ZK circuits: $(find . -name '*.circom' -o -name '*.nr' -o -name 'Nargo.toml' 2>/dev/null | wc -l)"
echo "Anchor programs: $(find . -path '*/programs/*/src/lib.rs' 2>/dev/null | wc -l)"
echo "Test files: $(find . -name '*.test.*' -o -name '*.spec.*' -o -name '*_test.rs' 2>/dev/null | wc -l)"

# 4. Red Flags
echo -e "\n## Red Flags"
echo "TODOs: $(grep -r 'TODO' --include='*.rs' --include='*.ts' --include='*.tsx' 2>/dev/null | wc -l)"
echo "Hardcoded keys: $(grep -rE '(secret|private|key)\s*[:=]\s*["\x27][A-Za-z0-9]{20,}' 2>/dev/null | wc -l)"
echo "XOR encryption: $(grep -r 'xor\|XOR' --include='*.rs' --include='*.ts' 2>/dev/null | wc -l)"
echo "Mock/fake: $(grep -ri 'mock\|fake\|simulated' --include='*.rs' --include='*.ts' 2>/dev/null | wc -l)"

# 5. Build
echo -e "\n## Build Status"
if [ -f "package.json" ]; then
    npm install --silent 2>/dev/null && npm run build --silent 2>/dev/null && echo "NPM build: PASS" || echo "NPM build: FAIL"
fi
if [ -f "Anchor.toml" ]; then
    anchor build 2>/dev/null && echo "Anchor build: PASS" || echo "Anchor build: FAIL"
fi
```

---

## Manual Review Checklist

### Quick Scan (2 minutes)
- [ ] README makes sense and is custom
- [ ] File structure is organized
- [ ] Git history shows real development
- [ ] No obvious red flags in code

### Deep Dive (10 minutes)
- [ ] Core logic is understandable
- [ ] Crypto implementation is real
- [ ] Tests exist and are meaningful
- [ ] Builds and runs
- [ ] Demo video matches code

### Legitimacy Questions
1. **Could I explain this code to someone?** If the author couldn't explain it, it's vibe coded.
2. **Are the hard parts actually implemented?** Or just TODOs and mocks?
3. **Does the git history tell a story?** Real development has debugging, reverts, iterations.
4. **Is the complexity justified?** Over-engineering for a hackathon is suspicious.

---

## Example Scores

### Polished Project (85/100)
- Clean code with consistent style (+20)
- 50 commits over 2 weeks, meaningful messages (+18)
- Working ZK circuits, real crypto (+18)
- Good README, architecture docs (+12)
- Builds, tests pass, deployed to devnet (+15)
- Minor TODOs (-2)

### Vibe Coded Project (25/100)
- Inconsistent style, no linting (+5)
- 3 commits in final day, "update" messages (+3)
- "Encryption" is just base64 (+2)
- Default README, no docs (+2)
- Doesn't build (+0)
- Mock everything, hardcoded keys (-15)

---

## Usage

1. Run automated checks: `./legitimacy-check.sh repos/<project>`
2. Score each category manually
3. Apply red flag deductions
4. Calculate final score
5. Classify project

This framework prioritizes **substance over presentation**. A project can have a beautiful UI but still be vibe coded if the core logic is mocked or copied.
