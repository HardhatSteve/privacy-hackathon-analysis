# Deploy-EERC CLI

A command-line tool for deploying and managing private ERC-20 tokens on Avalanche. This tool provides a simple interface for creating and managing privacy-focused tokens with zero-knowledge proof support.

## Features

* Deploy private ERC-20 tokens in two modes:
  * Standalone: Create new private tokens
  * Converter: Wrap existing ERC-20 tokens with privacy features
* User registration with viewing keys
* Private token operations:
  * Mint tokens privately
  * Transfer tokens privately
  * Burn tokens privately
  * Withdraw tokens (converter mode)
* Zero-knowledge proof support
* Network configuration management
* Gas price optimization

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/deploy-eerc.git
cd deploy-eerc

# Install dependencies
npm install

# Build the project
npm run build

# Link the CLI globally
npm link
```

## Configuration

1. Create a `.env` file in the project root:

```env
PRIVATE_KEY=your_private_key_here
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
MAINNET_RPC_URL=https://api.avax.network/ext/bc/C/rpc
```

2. Initialize the project:

```bash
deploy-eerc init
```

## Usage

### Deploy a New Private Token (Standalone Mode)

```bash
deploy-eerc standalone -n "Privacy Token" -s "PRIV" -t "1000000" -d 18
```

### Convert Existing Token (Converter Mode)

```bash
deploy-eerc converter -a <existing_token_address>
```

### Register a New User

```bash
deploy-eerc register
```

With custom private key:
```bash
deploy-eerc register -k <private_key>
```

### Private Token Operations

Mint tokens privately:
```bash
deploy-eerc mint -t <token_address> -a "1000" -r <recipient_address>
```

Transfer tokens privately:
```bash
deploy-eerc transfer -t <token_address> -a "100" -r <recipient_address> -m "Optional memo"
```

Burn tokens privately:
```bash
deploy-eerc burn -t <token_address> -a "50"
```

Withdraw tokens (converter mode only):
```bash
deploy-eerc withdraw -t <token_address> -a "100" -r <recipient_address>
```

### Global Options

All commands support these global options:
```bash
-n, --network <network>    Network to use (default: fuji)
-g, --gas-price <price>    Gas price in gwei
-s, --speed <speed>        Transaction speed (slow|normal|fast)
-y, --yes                  Skip confirmation prompts
```

## Development

```bash
# Run tests
npm test

# Compile contracts
npm run compile

# Lint code
npm run lint

# Format code
npm run format
```
## Step-by-Step Tutorial: Deploying eERC20 Tokens on Avalanche

### Prerequisites
- Node.js and npm installed  
- Hardhat installed globally  
- Testnet AVAX in a Fuji wallet  
- Recipient's encryption public key
  ```bash

## Security Features

* Zero-knowledge proof verification
* Private key management
* Secure viewing key generation
* Network validation
* Gas price optimization
* Transaction confirmation checks

## Technical Details

### Dependencies
* hardhat: Smart contract development and deployment
* @zk-kit/baby-jubjub: Cryptographic operations
* ethers: Blockchain interaction
* zkit: Zero-knowledge proof generation

### Key Components
* Verifier contracts for ZK proofs
* BabyJubJub library for cryptographic operations
* User registration system
* Private token operations

## Common Issues

* Network Connection: Ensure proper network configuration in .env
* Gas Issues: Use gas-price option to specify custom gas price
* Transaction Speed: Use speed option to adjust transaction speed
* Private Key: Keep your private key secure and never share it

## Need Help?

* Check the full documentation in README.md
* Join our Discord community
* Open an issue on GitHub

## Resources

* [Avalanche Documentation](https://docs.avax.network)
* [Hardhat Documentation](https://hardhat.org/getting-started/)
* [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
* [Snowtrace Explorer](https://snowtrace.io)

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Quick Start Guide

1. Install

```bash
npm install -g edeploy
```

2. Configure

```bash
# Create .env file
echo "PRIVATE_KEY=your_private_key_here" > .env

# Configure token
edeploy configure
```

3. Deploy

```bash
# Deploy to Fuji testnet
edeploy deploy --network fuji

# Verify contract
edeploy verify --network fuji
```

4. Test

```bash
# Check token balance
edeploy balance --token <contract_address>

# Transfer tokens
edeploy transfer --token <contract_address> --to <recipient> --amount <amount>
```
## Step-by-Step Tutorial: Deploying eERC20 Tokens on Avalanche

### Prerequisites
- Node.js and npm installed  
- Hardhat installed globally  
- Testnet AVAX in a Fuji wallet  
- Recipient's encryption public key  

### 1. Clone the Repository
```bash
git clone https://github.com/sisi-hacks/Avax-contest.git
cd Avax-contest
2. Install Dependencies
bash
Copy
Edit
npm install
3. Create Your Environment File
Create a .env file in the project root with the following content:

env
Copy
Edit
PRIVATE_KEY=your_fuji_private_key
API_URL=https://api.avax-test.network/ext/bc/C/rpc
4. Deploy Token
bash
Copy
Edit
npx hardhat run scripts/deploy.js --network fuji
Enter your token name, symbol, and recipient's encryption public key when prompted.

On success, you'll receive the deployed contract address.  


## Common Issues

* Make sure you have FUJI testnet AVAX
* Keep your private key secure
* Verify contract after deployment

## Need Help?

* Check the full documentation in README.md
* Open an issue on GitHub

## Resources

* [Avalanche Documentation](https://docs.avax.network)
* [Hardhat Documentation](https://hardhat.org/getting-started/)
* [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
*  [Snowtrace Explorer](https://snowtrace.io)

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
