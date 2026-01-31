#!/bin/bash
# GitHub Push Instructions
# Replace YOUR_USERNAME with your actual GitHub username

echo "After creating your GitHub repository, run these commands:"
echo ""
echo "git remote add origin https://github.com/YOUR_USERNAME/solana-exposure-scanner.git"
echo "git branch -M main"
echo "git push -u origin main"
echo ""
echo "Then visit your repo and add these environment variables in Vercel:"
echo "- HELIUS_API_KEY"
echo "- BIRDEYE_API_KEY"
