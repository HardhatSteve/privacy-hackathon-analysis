#!/bin/bash
# Build repo-index.json by scanning all cloned repositories
# Includes time-biased scoring for hackathon likelihood

set -e
cd "$(dirname "$0")/.."

HACKATHON_START="2026-01-12"
HACKATHON_END="2026-02-01"
LAST_MINUTE_START="2026-01-30"  # Final 48hrs

echo '{'
echo '  "last_full_sync": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",'
echo '  "hackathon_window": {'
echo '    "start": "'$HACKATHON_START'",'
echo '    "end": "'$HACKATHON_END'",'
echo '    "last_minute_start": "'$LAST_MINUTE_START'"'
echo '  },'
echo '  "repos": {'

first=true
for dir in repos/*/; do
    dir="${dir%/}"          # Now: repos/reponame
    basename="${dir#repos/}" # Extract: reponame

    # Skip if not a directory
    [[ ! -d "$dir" ]] && continue

    # Get git info (may not exist for copied repos)
    if [[ -d "$dir/.git" ]]; then
        head_commit=$(cd "$dir" && git rev-parse HEAD 2>/dev/null || echo "unknown")
        head_commit_short="${head_commit:0:7}"
        remote_url=$(cd "$dir" && git remote get-url origin 2>/dev/null || echo "unknown")
        last_commit_date=$(cd "$dir" && git log -1 --format=%aI 2>/dev/null || echo "unknown")
        first_commit_date=$(cd "$dir" && git log --reverse --format=%aI 2>/dev/null | head -1 || echo "unknown")
    else
        head_commit="no-git-metadata"
        head_commit_short="no-git"
        remote_url="unknown"
        # Use file modification time as proxy
        last_commit_date=$(stat -f "%Sm" -t "%Y-%m-%dT%H:%M:%S" "$dir" 2>/dev/null || echo "unknown")
        first_commit_date="unknown"
    fi

    # Check for existing analysis file (uses basename for analyses path)
    analysis_file=""
    if [[ -f "analyses/$basename/$head_commit_short.md" ]]; then
        analysis_file="analyses/$basename/$head_commit_short.md"
    elif [[ -f "analyses/$basename/LATEST.md" ]]; then
        analysis_file="analyses/$basename/LATEST.md"
    fi

    # Initialize score
    score=0
    reasons=()

    # TIME-BIASED HEURISTICS

    # Heuristic 1: Last-minute activity (+30) - CRITICAL
    if [[ "$last_commit_date" != "unknown" ]]; then
        commit_date_only="${last_commit_date:0:10}"
        if [[ "$commit_date_only" > "$LAST_MINUTE_START" || "$commit_date_only" == "$LAST_MINUTE_START" ]] && [[ "$commit_date_only" < "2026-02-02" ]]; then
            score=$((score + 30))
            reasons+=("Last-minute activity (+30)")
        # Heuristic 2: Hackathon window activity (+20) - HIGH
        elif [[ "$commit_date_only" > "$HACKATHON_START" || "$commit_date_only" == "$HACKATHON_START" ]] && [[ "$commit_date_only" < "2026-02-02" ]]; then
            score=$((score + 20))
            reasons+=("Hackathon window activity (+20)")
        fi
    fi

    # Heuristic 3: Created during hackathon (+15) - HIGH
    if [[ "$first_commit_date" != "unknown" ]]; then
        first_date_only="${first_commit_date:0:10}"
        if [[ "$first_date_only" > "$HACKATHON_START" || "$first_date_only" == "$HACKATHON_START" ]]; then
            score=$((score + 15))
            reasons+=("Created during hackathon (+15)")
        fi
    fi

    # Heuristic 4: README mentions hackathon (+10) - MEDIUM
    if [[ -f "$dir/README.md" ]]; then
        if grep -qiE "(hackathon|privacy.?hack|solana.?privacy)" "$dir/README.md" 2>/dev/null; then
            score=$((score + 10))
            reasons+=("README mentions hackathon (+10)")
        fi
    fi

    # Heuristic 5: Has Solana dependencies (+10) - MEDIUM
    has_solana=false
    if [[ -f "$dir/Cargo.toml" ]] && grep -q "solana" "$dir/Cargo.toml" 2>/dev/null; then
        has_solana=true
    fi
    if [[ -f "$dir/package.json" ]] && grep -q "@solana" "$dir/package.json" 2>/dev/null; then
        has_solana=true
    fi
    # Check nested files
    if find "$dir" -name "Cargo.toml" -maxdepth 4 2>/dev/null | head -5 | xargs grep -l "solana" 2>/dev/null | head -1 | grep -q .; then
        has_solana=true
    fi
    if find "$dir" -name "package.json" -maxdepth 4 2>/dev/null | head -5 | xargs grep -l "@solana" 2>/dev/null | head -1 | grep -q .; then
        has_solana=true
    fi
    if $has_solana; then
        score=$((score + 10))
        reasons+=("Has Solana dependencies (+10)")
    fi

    # Heuristic 6: Has ZK circuits (+5) - LOW
    has_zk=false
    zk_system="none"
    if [[ -d "$dir/circuits" ]]; then
        has_zk=true
    fi
    if find "$dir" -name "*.circom" -maxdepth 4 2>/dev/null | head -1 | grep -q .; then
        has_zk=true
        zk_system="Groth16/Circom"
    fi
    if find "$dir" -name "*.noir" -maxdepth 4 2>/dev/null | head -1 | grep -q .; then
        has_zk=true
        zk_system="Noir"
    fi
    if find "$dir" -name "Nargo.toml" -maxdepth 4 2>/dev/null | head -1 | grep -q .; then
        has_zk=true
        zk_system="Noir"
    fi
    if $has_zk; then
        score=$((score + 5))
        reasons+=("Has ZK circuits (+5)")
    fi

    # Heuristic 7: Has Anchor program (+5) - LOW
    anchor_count=0
    if find "$dir" -path "*/programs/*/src/lib.rs" -maxdepth 5 2>/dev/null | head -1 | grep -q .; then
        anchor_count=$(find "$dir" -path "*/programs/*/src/lib.rs" -maxdepth 5 2>/dev/null | wc -l | tr -d ' ')
        score=$((score + 5))
        reasons+=("Has Anchor program (+5)")
    fi

    # Heuristic 8: Privacy keywords in code (+5) - LOW
    if grep -rqE "(shielded|nullifier|commitment|stealth.?address)" "$dir" --include="*.rs" --include="*.ts" --include="*.js" 2>/dev/null; then
        score=$((score + 5))
        reasons+=("Privacy keywords in code (+5)")
    fi

    # Classify
    if [[ $score -ge 70 ]]; then
        classification="HIGH"
    elif [[ $score -ge 40 ]]; then
        classification="MEDIUM"
    else
        classification="LOW"
    fi

    # Build reasons JSON array
    reasons_json="["
    reasons_first=true
    for reason in "${reasons[@]}"; do
        if $reasons_first; then
            reasons_first=false
        else
            reasons_json+=", "
        fi
        reasons_json+="\"$reason\""
    done
    reasons_json+="]"

    # Output JSON
    if $first; then
        first=false
    else
        echo ","
    fi

    # Escape any special chars in analysis_file path
    analysis_file_json="null"
    if [[ -n "$analysis_file" ]]; then
        analysis_file_json="\"$analysis_file\""
    fi

    cat <<EOF
    "$basename": {
      "remote_url": "$remote_url",
      "head_commit": "$head_commit",
      "head_commit_short": "$head_commit_short",
      "last_commit_date": "$last_commit_date",
      "last_synced": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
      "analysis_file": $analysis_file_json,
      "hackathon_likelihood": $score,
      "likelihood_classification": "$classification",
      "likelihood_reasons": $reasons_json,
      "technical_summary": {
        "zk_system": "$zk_system",
        "solana_programs": $anchor_count
      }
    }
EOF

done

echo ''
echo '  }'
echo '}'
