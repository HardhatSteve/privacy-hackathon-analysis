#!/bin/bash
# Re-clone repos that are missing .git directories
cd "$(dirname "$0")/.."

REPOS_DIR="repos"

echo "=== Re-cloning repos missing .git directories ==="
echo "Started at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

CLONED=0
FAILED=0
SKIPPED=0

# Function to clone a repo
clone_repo() {
    local repo_name="$1"
    local repo_url="$2"
    local repo_dir="$REPOS_DIR/$repo_name"

    # Check if .git exists
    if [[ -d "$repo_dir/.git" ]]; then
        echo "SKIP: $repo_name (already has .git)"
        SKIPPED=$((SKIPPED + 1))
        return 0
    fi

    echo -n "Cloning $repo_name... "

    # Remove existing directory if it exists
    if [[ -d "$repo_dir" ]]; then
        rm -rf "$repo_dir"
    fi

    # Clone
    if git clone --depth 1 "$repo_url" "$repo_dir" 2>/dev/null; then
        echo "OK"
        CLONED=$((CLONED + 1))
    else
        echo "FAILED"
        FAILED=$((FAILED + 1))
    fi
    return 0
}

# Clone each repo
clone_repo "anamnesis" "https://github.com/ranuts/anamnesis"
clone_repo "anoma.cash" "https://github.com/anomacash/anoma.cash"
clone_repo "anon0mesh" "https://github.com/anon0mesh/anon0mesh"
clone_repo "arcium-dev-skill" "https://github.com/outsmartchad/arcium-dev-skill"
clone_repo "Arcshield" "https://github.com/EmperorLuxionVibecoder/Arcshield"
clone_repo "Auction-App-Data-Processing_AWS-Pipeline" "https://github.com/ArgyaSR/Auction-App-Data-Processing_AWS-Pipeline"
clone_repo "AURORAZK_SUBMISSION" "https://github.com/PotluckProtocol/AURORAZK_SUBMISSION"
clone_repo "awesome-privacy-on-solana" "https://github.com/catmcgee/awesome-privacy-on-solana"
clone_repo "blog-sip" "https://github.com/sip-protocol/blog-sip"
clone_repo "circuits" "https://github.com/sip-protocol/circuits"
clone_repo "cleanproof-frontend" "https://github.com/Pavelevich/cleanproof-frontend"
clone_repo "core" "https://github.com/orroprotocol/core"
clone_repo "custos-cli" "https://github.com/Custos-Sec/custos-cli"
clone_repo "Dark-Null-Protocol" "https://github.com/Parad0x-Labs/Dark-Null-Protocol"
clone_repo "deploy-shield" "https://github.com/Emengkeng/deploy-shield"
clone_repo "docs-sip" "https://github.com/sip-protocol/docs-sip"
clone_repo "donatrade" "https://github.com/donatrade/donatrade"
clone_repo "ECHO" "https://github.com/Shawnchee/ECHO"
clone_repo "hushfold" "https://github.com/hushfold/hushfold"
clone_repo "IAP" "https://github.com/IAP-xyz/IAP"
clone_repo "incognito-protocol" "https://github.com/incognito-protocol/incognito-protocol"
clone_repo "n8n-nodes-trezor" "https://github.com/velocity-bpa/n8n-nodes-trezor"
clone_repo "paraloom-core" "https://github.com/paraloom-labs/paraloom-core"
clone_repo "pigeon" "https://github.com/pigeon-chat/pigeon"
clone_repo "PNPFUCIUS" "https://github.com/pnp-protocol/pnpfucius"
clone_repo "privacy-pay" "https://github.com/yomite47/privacy-pay"
clone_repo "privacy-vault" "https://github.com/Pavelevich/privacy-vault"
clone_repo "privacylens" "https://github.com/privacylens/privacylens"
clone_repo "PublicTesting" "https://github.com/PublicTesting/PublicTesting"
clone_repo "QN-Privacy-Gateway" "https://github.com/QN-Privacy-Gateway/QN-Privacy-Gateway"
clone_repo "ruka0911" "https://github.com/ruka0911/ruka0911"
clone_repo "seedpay-solana-privacy-hack" "https://github.com/seedpay/seedpay-solana-privacy-hack"
clone_repo "shadow-fence" "https://github.com/techbones59/shadow-fence"
clone_repo "shadow-tracker" "https://github.com/Pavelevich/shadow-tracker"
clone_repo "shielded-pool-pinocchio-solana" "https://github.com/shielded-pool/shielded-pool-pinocchio-solana"
clone_repo "sip-protocol" "https://github.com/sip-protocol/sip-protocol"
clone_repo "sip-website" "https://github.com/sip-protocol/sip-website"
clone_repo "solana-exposure-scanner-2" "https://github.com/solana-exposure-scanner/solana-exposure-scanner-2"
clone_repo "solana-exposure-scanner" "https://github.com/solanagod2003-gif/solana-exposure-scanner"
clone_repo "Solana-Privacy-CLI" "https://github.com/Solana-Privacy-CLI/Solana-Privacy-CLI"
clone_repo "Solana-Privacy-Hack-" "https://github.com/Solana-Privacy-Hack/Solana-Privacy-Hack-"
clone_repo "solana-privacy-hack-frontend" "https://github.com/solana-privacy-hack/solana-privacy-hack-frontend"
clone_repo "Solana-Privacy-Hackathon-2026" "https://github.com/Solana-Privacy-Hackathon-2026/Solana-Privacy-Hackathon-2026"
clone_repo "solana-privacy-rpc" "https://github.com/solana-privacy-rpc/solana-privacy-rpc"
clone_repo "solana-privacy-shield" "https://github.com/solana-privacy-shield/solana-privacy-shield"
clone_repo "SolanaPrivacyHackathon2026" "https://github.com/joinQuantish/SolanaPrivacyHackathon2026"
clone_repo "solprivacy-cli" "https://github.com/Pavelevich/solprivacy-cli"
clone_repo "solShare" "https://github.com/solShare/solShare"
clone_repo "SolsticeProtocol" "https://github.com/Shaurya2k06/SolsticeProtocol"
clone_repo "stealth-rails-SDK" "https://github.com/stealth-rails/stealth-rails-SDK"
clone_repo "synelar" "https://github.com/synelar/synelar"
clone_repo "unified-trust-protocol-sdk" "https://github.com/unified-trust-protocol/unified-trust-protocol-sdk"
clone_repo "unstoppable-wallet-android" "https://github.com/horizontalsystems/unstoppable-wallet-android"
clone_repo "vapor-tokens" "https://github.com/vapor-tokens/vapor-tokens"
clone_repo "veil" "https://github.com/psyto/veil"
clone_repo "velum" "https://github.com/velumdotcash/velum"
clone_repo "wavis-protocol" "https://github.com/wavis-protocol/wavis-protocol"
clone_repo "yieldcash-solana-privacy" "https://github.com/yieldcash/yieldcash-solana-privacy"
clone_repo "zelana" "https://github.com/zelana-labs/zelana"
clone_repo "zkprof" "https://github.com/zkprof/zkprof"
clone_repo "zmix" "https://github.com/zmix-sol/zmix"

echo ""
echo "=== SUMMARY ==="
echo "Cloned:  $CLONED"
echo "Skipped: $SKIPPED"
echo "Failed:  $FAILED"
echo ""
echo "Completed at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Rebuild repo index
echo ""
echo "Rebuilding repo-index.json..."
./scripts/build-repo-index.sh > repo-index.json
echo "Done!"
