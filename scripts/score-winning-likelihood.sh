#!/bin/bash
# Score winning likelihood for each hackathon project
# Uses existing analyses and sponsor integration detection
# Updated with all 16 sponsor bounties from https://solana.com/privacyhack

set -e
cd "$(dirname "$0")/.."

echo "# Winning Likelihood Analysis"
echo ""
echo "**Analysis Date**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "**Hackathon**: Solana Privacy Hack (Jan 12 - Feb 1, 2026)"
echo "**Source**: https://solana.com/privacyhack"
echo ""

# Temporary file for collecting scores
scores_file=$(mktemp)

for dir in competition-intel/repos/*/; do
    [[ ! -d "$dir" ]] && continue
    basename="${dir%/}"
    basename="${basename##*/}"  # Extract just the repo name

    score=0
    track=""
    sponsors=()
    gaps=()

    # Check for analysis file
    has_analysis=false
    if [[ -f "competition-intel/analyses/$basename.md" ]]; then
        has_analysis=true
    fi

    # === TRACK FIT (0-25) ===
    track_score=0

    # Private Payments indicators
    if grep -rqiE "(payment|transfer|shielded.?pool|stealth.?address|utxo)" "$dir" --include="*.md" --include="*.rs" --include="*.ts" 2>/dev/null; then
        if grep -rqiE "(token|sol|spl|lamport)" "$dir" --include="*.rs" --include="*.ts" 2>/dev/null; then
            track="Private Payments"
            track_score=20
        fi
    fi

    # Privacy Tooling indicators
    if grep -rqiE "(sdk|cli|scanner|analyzer|library|infrastructure)" "$dir" --include="*.md" 2>/dev/null; then
        if [[ -f "$dir/package.json" ]] || [[ -d "$dir/cli" ]] || [[ -d "$dir/sdk" ]]; then
            if [[ -z "$track" ]] || [[ "$track_score" -lt 20 ]]; then
                track="Privacy Tooling"
                track_score=20
            fi
        fi
    fi

    # Open Track indicators
    if grep -rqiE "(messaging|identity|gaming|nft|social|voting|prediction)" "$dir" --include="*.md" --include="*.rs" --include="*.ts" 2>/dev/null; then
        if [[ -z "$track" ]]; then
            track="Open Track"
            track_score=15
        fi
    fi

    [[ -z "$track" ]] && track="Unknown" && track_score=5
    score=$((score + track_score))

    # === SPONSOR BOUNTY DETECTION (0-30) ===
    # All 16 sponsors from https://solana.com/privacyhack
    sponsor_score=0

    # 1. Privacy Cash ($15k) - Best Overall App, Best Integration
    if grep -rqiE "(privacycash|privacy.?cash|@privacycash)" "$dir" --include="*.json" --include="*.ts" --include="*.js" --include="*.md" 2>/dev/null; then
        sponsors+=("Privacy Cash")
        sponsor_score=$((sponsor_score + 10))
    fi

    # 2. Radr Labs ($15k) - ShadowWire, Bulletproofs
    if grep -rqiE "(shadowwire|@radr|radr.?labs|bulletproof)" "$dir" --include="*.json" --include="*.ts" --include="*.js" --include="*.md" 2>/dev/null; then
        sponsors+=("Radr")
        sponsor_score=$((sponsor_score + 10))
    fi

    # 3. Anoncoin ($10k) - Confidential tokens, dark liquidity
    if grep -rqiE "(anoncoin|confidential.?token|dark.?liquidity|dark.?pool)" "$dir" --include="*.json" --include="*.ts" --include="*.js" --include="*.md" --include="*.rs" 2>/dev/null; then
        sponsors+=("Anoncoin")
        sponsor_score=$((sponsor_score + 10))
    fi

    # 4. Arcium ($10k) - MPC, encrypted shared state
    if grep -rqiE "(@arcium|arcium|mxe|confidential.?computing|encrypted.?state)" "$dir" --include="*.json" --include="*.ts" --include="*.rs" --include="*.md" 2>/dev/null; then
        sponsors+=("Arcium")
        sponsor_score=$((sponsor_score + 10))
    fi

    # 5. Aztec/Noir ($10k) - Noir language ZK
    if [[ -f "$dir/Nargo.toml" ]] || find "$dir" -name "*.noir" -maxdepth 4 2>/dev/null | head -1 | grep -q .; then
        sponsors+=("Noir/Aztec")
        sponsor_score=$((sponsor_score + 10))
    elif grep -rqiE "(noir.?lang|aztec|noir.?circuit)" "$dir" --include="*.json" --include="*.md" 2>/dev/null; then
        sponsors+=("Noir/Aztec")
        sponsor_score=$((sponsor_score + 10))
    fi

    # 6. Inco ($6k) - FHE, Inco Lightning
    if grep -rqiE "(@inco|inco.?fhe|inco.?lightning|fully.?homomorphic|fhe)" "$dir" --include="*.json" --include="*.ts" --include="*.md" 2>/dev/null; then
        sponsors+=("Inco")
        sponsor_score=$((sponsor_score + 8))
    fi

    # 7. Helius ($5k) - Helius RPC
    if grep -rqiE "(helius|helius-rpc|@helius)" "$dir" --include="*.ts" --include="*.js" --include="*.env*" --include="*.md" 2>/dev/null; then
        sponsors+=("Helius")
        sponsor_score=$((sponsor_score + 5))
    fi

    # 8. MagicBlock ($5k) - Private Ephemeral Rollups (PER)
    if grep -rqiE "(@magicblock|magicblock|ephemeral.?rollup|per.?protocol)" "$dir" --include="*.json" --include="*.ts" --include="*.md" 2>/dev/null; then
        sponsors+=("MagicBlock")
        sponsor_score=$((sponsor_score + 5))
    fi

    # 9. SilentSwap ($5k) - Private cross-chain
    if grep -rqiE "(silentswap|silent.?swap|private.?bridge|cross.?chain.?privacy)" "$dir" --include="*.json" --include="*.ts" --include="*.md" 2>/dev/null; then
        sponsors+=("SilentSwap")
        sponsor_score=$((sponsor_score + 5))
    fi

    # 10. Starpay ($3.5k) - Privacy payments
    if grep -rqiE "(starpay|star.?pay)" "$dir" --include="*.json" --include="*.ts" --include="*.md" 2>/dev/null; then
        sponsors+=("Starpay")
        sponsor_score=$((sponsor_score + 4))
    fi

    # 11. QuickNode ($3k) - Open source privacy tooling
    if grep -rqiE "(quicknode|quick.?node|@quicknode)" "$dir" --include="*.ts" --include="*.js" --include="*.env*" --include="*.md" 2>/dev/null; then
        sponsors+=("QuickNode")
        sponsor_score=$((sponsor_score + 4))
    fi

    # 12. PNP Exchange ($2.5k) - AI agents, prediction markets
    if grep -rqiE "(pnp.?exchange|pnp.?protocol|prediction.?market|ai.?agent)" "$dir" --include="*.json" --include="*.ts" --include="*.md" 2>/dev/null; then
        sponsors+=("PNP Exchange")
        sponsor_score=$((sponsor_score + 3))
    fi

    # 13. Range ($1.5k+) - Compliant privacy
    if grep -rqiE "(range.?protocol|@range|compliance.?privacy|compliant.?privacy)" "$dir" --include="*.json" --include="*.ts" --include="*.md" 2>/dev/null; then
        sponsors+=("Range")
        sponsor_score=$((sponsor_score + 2))
    fi

    # 14. Encrypt.trade ($1k) - Privacy education
    if grep -rqiE "(encrypt\.trade|wallet.?surveillance|privacy.?education)" "$dir" --include="*.md" 2>/dev/null; then
        sponsors+=("Encrypt.trade")
        sponsor_score=$((sponsor_score + 1))
    fi

    # 15. Light Protocol (part of Open Track $18k)
    if grep -rqiE "(@lightprotocol|light.?protocol|compressed.?account|zk.?compression)" "$dir" --include="*.json" --include="*.ts" --include="*.md" 2>/dev/null; then
        sponsors+=("Light Protocol")
        sponsor_score=$((sponsor_score + 5))
    fi

    # 16. Groth16/Circom (general ZK - affects multiple bounties)
    if find "$dir" -name "*.circom" -maxdepth 4 2>/dev/null | head -1 | grep -q .; then
        sponsors+=("Groth16")
        sponsor_score=$((sponsor_score + 3))
    fi

    # Cap at 30
    [[ $sponsor_score -gt 30 ]] && sponsor_score=30
    score=$((score + sponsor_score))

    # === SUBMISSION COMPLETENESS (0-25) ===
    complete_score=0

    # Demo video (REQUIRED)
    if grep -rqiE "(youtube\.com|youtu\.be|loom\.com|\.mp4|demo.?video)" "$dir/README.md" 2>/dev/null; then
        complete_score=$((complete_score + 10))
    elif find "$dir" -name "*.mp4" -maxdepth 3 2>/dev/null | head -1 | grep -q .; then
        complete_score=$((complete_score + 10))
    else
        gaps+=("No demo video")
    fi

    # Documentation (REQUIRED)
    if [[ -f "$dir/README.md" ]] && [[ $(wc -l < "$dir/README.md" 2>/dev/null || echo 0) -gt 50 ]]; then
        complete_score=$((complete_score + 5))
    elif [[ -d "$dir/docs" ]]; then
        complete_score=$((complete_score + 5))
    else
        gaps+=("Minimal docs")
    fi

    # Devnet deployment (REQUIRED)
    if grep -rqiE "(program.?id|devnet|deployed)" "$dir/README.md" 2>/dev/null; then
        complete_score=$((complete_score + 5))
    elif grep -rqiE "declare_id!" "$dir" --include="*.rs" 2>/dev/null; then
        complete_score=$((complete_score + 5))
    else
        gaps+=("No deployment proof")
    fi

    # Mainnet deployment (bonus)
    if grep -rqiE "(mainnet.?beta|mainnet)" "$dir/README.md" 2>/dev/null; then
        complete_score=$((complete_score + 5))
    fi

    score=$((score + complete_score))

    # === TECHNICAL QUALITY (0-20) ===
    tech_score=10  # Base score, adjusted by findings

    # Real ZK implementation (not mocked)
    if find "$dir" -name "*.circom" -o -name "Nargo.toml" -maxdepth 4 2>/dev/null | head -1 | grep -q .; then
        if ! grep -rqiE "(mock|fake|placeholder|todo.?implement)" "$dir" --include="*.circom" --include="*.noir" 2>/dev/null; then
            tech_score=$((tech_score + 5))
        fi
    fi

    # Has tests
    if [[ -d "$dir/tests" ]] || find "$dir" -name "*.test.ts" -o -name "*_test.rs" -o -name "*.spec.ts" -maxdepth 4 2>/dev/null | head -1 | grep -q .; then
        tech_score=$((tech_score + 5))
    else
        gaps+=("No tests")
    fi

    # Red flags (deductions)
    if grep -rqiE "(xor|0x00000000|hardcoded.?key|unsafe\s)" "$dir" --include="*.rs" --include="*.ts" 2>/dev/null; then
        tech_score=$((tech_score - 5))
        gaps+=("Security concerns")
    fi

    [[ $tech_score -lt 0 ]] && tech_score=0
    [[ $tech_score -gt 20 ]] && tech_score=20
    score=$((score + tech_score))

    # === LIKELIHOOD CLASSIFICATION ===
    if [[ $score -ge 80 ]]; then
        likelihood="VERY HIGH"
    elif [[ $score -ge 60 ]]; then
        likelihood="HIGH"
    elif [[ $score -ge 40 ]]; then
        likelihood="MEDIUM"
    elif [[ $score -ge 20 ]]; then
        likelihood="LOW"
    else
        likelihood="VERY LOW"
    fi

    # Format sponsors
    sponsors_str=$(IFS=,; echo "${sponsors[*]}")
    [[ -z "$sponsors_str" ]] && sponsors_str="none"

    # Format gaps
    gaps_str=$(IFS=,; echo "${gaps[*]}")
    [[ -z "$gaps_str" ]] && gaps_str="none"

    # Output to temp file for sorting
    echo "$score|$basename|$likelihood|$track|$sponsors_str|$track_score|$sponsor_score|$complete_score|$tech_score|$gaps_str|$has_analysis" >> "$scores_file"
done

# Count totals
total=$(wc -l < "$scores_file" | tr -d ' ')
very_high=$(grep -c "VERY HIGH" "$scores_file" || echo 0)
high=$(grep -c "|HIGH|" "$scores_file" || echo 0)
medium=$(grep -c "MEDIUM" "$scores_file" || echo 0)
low=$(grep -c "|LOW|" "$scores_file" || echo 0)

echo "## Summary"
echo ""
echo "| Likelihood | Count |"
echo "|------------|-------|"
echo "| VERY HIGH | $very_high |"
echo "| HIGH | $high |"
echo "| MEDIUM | $medium |"
echo "| LOW | $low |"
echo "| **Total** | $total |"
echo ""

# Sort by score descending and output
echo "## Full Ranking"
echo ""
echo "| Rank | Project | Score | Likelihood | Track | Sponsors | Gaps |"
echo "|------|---------|-------|------------|-------|----------|------|"

rank=1
sort -t'|' -k1 -nr "$scores_file" | while IFS='|' read -r score proj likelihood track sponsors track_s sponsor_s complete_s tech_s gaps has_analysis; do
    echo "| $rank | $proj | $score | $likelihood | $track | $sponsors | $gaps |"
    rank=$((rank + 1))
done

echo ""
echo "## By Track"
echo ""

for track_name in "Private Payments" "Privacy Tooling" "Open Track"; do
    echo "### $track_name"
    case "$track_name" in
        "Private Payments") echo "**Prize**: \$15,000" ;;
        "Privacy Tooling") echo "**Prize**: \$15,000" ;;
        "Open Track") echo "**Prize**: \$18,000 (Light Protocol + Solana Foundation)" ;;
    esac
    echo ""
    echo "| Rank | Project | Score | Sponsors |"
    echo "|------|---------|-------|----------|"
    rank=1
    grep "|$track_name|" "$scores_file" | sort -t'|' -k1 -nr | head -10 | while IFS='|' read -r score proj likelihood track sponsors rest; do
        echo "| $rank | $proj | $score | $sponsors |"
        rank=$((rank + 1))
    done
    echo ""
done

echo "## By Sponsor Bounty"
echo ""

# Get prize for sponsor
get_prize() {
    case "$1" in
        "Privacy Cash") echo "\$15,000" ;;
        "Radr") echo "\$15,000" ;;
        "Anoncoin") echo "\$10,000" ;;
        "Arcium") echo "\$10,000" ;;
        "Noir/Aztec") echo "\$10,000" ;;
        "Inco") echo "\$6,000" ;;
        "Helius") echo "\$5,000" ;;
        "MagicBlock") echo "\$5,000" ;;
        "SilentSwap") echo "\$5,000" ;;
        "Starpay") echo "\$3,500" ;;
        "QuickNode") echo "\$3,000" ;;
        "PNP Exchange") echo "\$2,500" ;;
        "Range") echo "\$1,500+" ;;
        "Encrypt.trade") echo "\$1,000" ;;
        "Light Protocol") echo "\$18,000 (Open Track)" ;;
        "Groth16") echo "(ZK infrastructure)" ;;
        *) echo "" ;;
    esac
}

for sponsor in "Privacy Cash" "Radr" "Anoncoin" "Arcium" "Noir/Aztec" "Inco" "Helius" "MagicBlock" "SilentSwap" "Starpay" "QuickNode" "PNP Exchange" "Range" "Light Protocol" "Groth16"; do
    count=$(grep -c "$sponsor" "$scores_file" 2>/dev/null || echo 0)
    prize=$(get_prize "$sponsor")
    if [[ $count -gt 0 ]]; then
        echo "### $sponsor ($prize) - $count projects"
        echo ""
        echo "| Project | Score | Other Sponsors |"
        echo "|---------|-------|----------------|"
        grep "$sponsor" "$scores_file" | sort -t'|' -k1 -nr | head -5 | while IFS='|' read -r score proj likelihood track sponsors rest; do
            # Remove current sponsor from list for "other sponsors" column
            other_sponsors=$(echo "$sponsors" | sed "s/$sponsor//g" | sed 's/,,/,/g' | sed 's/^,//;s/,$//')
            [[ -z "$other_sponsors" ]] && other_sponsors="-"
            echo "| $proj | $score | $other_sponsors |"
        done
        echo ""
    fi
done

echo "## Missing Submission Requirements"
echo ""
echo "Projects missing critical elements:"
echo ""
echo "| Project | Missing |"
echo "|---------|---------|"
grep -E "No demo video|No deployment" "$scores_file" | sort -t'|' -k1 -nr | head -20 | while IFS='|' read -r score proj likelihood track sponsors track_s sponsor_s complete_s tech_s gaps has_analysis; do
    echo "| $proj | $gaps |"
done

rm -f "$scores_file"
