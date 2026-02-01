#!/bin/bash
# Sync all hackathon repos - check for updates using git hashes
# Usage: ./scripts/sync-repos.sh [--force]

set -e
cd "$(dirname "$0")/.."

REPOS_DIR="competition-intel/repos"
INDEX_FILE="competition-intel/repo-index.json"
FORCE_RECLONE="${1:-}"

# Counters
NEW_COUNT=0
UPDATED_COUNT=0
UNCHANGED_COUNT=0
FAILED_COUNT=0
UPDATED_REPOS=()

echo "=== Solana Privacy Hackathon Repo Sync ==="
echo "Started at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

# Load existing index for previous hashes
if [[ -f "$INDEX_FILE" ]]; then
    echo "Loading existing repo-index.json..."
else
    echo "No existing index found, will treat all repos as new."
fi

# Function to get previous hash from index
get_previous_hash() {
    local repo_name="$1"
    if [[ -f "$INDEX_FILE" ]]; then
        jq -r ".repos[\"$repo_name\"].head_commit // \"none\"" "$INDEX_FILE" 2>/dev/null || echo "none"
    else
        echo "none"
    fi
}

# Process each repo directory
for dir in "$REPOS_DIR"/*/; do
    [[ ! -d "$dir" ]] && continue

    dir="${dir%/}"
    repo_name="${dir#$REPOS_DIR/}"

    # Skip non-git directories
    if [[ ! -d "$dir/.git" ]]; then
        echo "SKIP: $repo_name (no .git directory)"
        continue
    fi

    # Get current local hash
    current_hash=$(cd "$dir" && git rev-parse HEAD 2>/dev/null || echo "unknown")
    current_hash_short="${current_hash:0:7}"

    # Get previous hash from index
    previous_hash=$(get_previous_hash "$repo_name")
    previous_hash_short="${previous_hash:0:7}"

    # Get remote URL
    remote_url=$(cd "$dir" && git remote get-url origin 2>/dev/null || echo "")

    if [[ -z "$remote_url" || "$remote_url" == "" ]]; then
        echo "SKIP: $repo_name (no remote URL)"
        continue
    fi

    # Check remote hash (fast - no download)
    echo -n "Checking $repo_name... "
    remote_hash=$(git ls-remote "$remote_url" HEAD 2>/dev/null | cut -f1 || echo "failed")

    if [[ "$remote_hash" == "failed" || -z "$remote_hash" ]]; then
        echo "FAILED (could not reach remote)"
        ((FAILED_COUNT++))
        continue
    fi

    remote_hash_short="${remote_hash:0:7}"

    # Compare hashes
    if [[ "$FORCE_RECLONE" == "--force" ]]; then
        echo "FORCE RE-CLONE: $repo_name"
        rm -rf "$dir"
        git clone --depth 1 "$remote_url" "$dir" 2>/dev/null
        ((UPDATED_COUNT++))
        UPDATED_REPOS+=("$repo_name")
    elif [[ "$current_hash" == "$remote_hash" ]]; then
        echo "UNCHANGED @ $current_hash_short"
        ((UNCHANGED_COUNT++))
    else
        echo "UPDATED: $current_hash_short -> $remote_hash_short"

        # Re-clone to get fresh copy
        rm -rf "$dir"
        if git clone --depth 1 "$remote_url" "$dir" 2>/dev/null; then
            ((UPDATED_COUNT++))
            UPDATED_REPOS+=("$repo_name")
        else
            echo "  ERROR: Failed to re-clone"
            ((FAILED_COUNT++))
        fi
    fi
done

echo ""
echo "=== SYNC SUMMARY ==="
echo "Unchanged: $UNCHANGED_COUNT"
echo "Updated:   $UPDATED_COUNT"
echo "Failed:    $FAILED_COUNT"
echo ""

if [[ ${#UPDATED_REPOS[@]} -gt 0 ]]; then
    echo "=== REPOS WITH UPDATES ==="
    for repo in "${UPDATED_REPOS[@]}"; do
        echo "  - $repo"
    done
    echo ""
fi

echo "Completed at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Rebuild the index
echo ""
echo "Rebuilding repo-index.json..."
./scripts/build-repo-index.sh > "$INDEX_FILE"
echo "Done!"
