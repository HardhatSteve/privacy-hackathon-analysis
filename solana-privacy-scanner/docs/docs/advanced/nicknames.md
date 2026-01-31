# Address Nicknames

Reading 44-character Solana addresses in privacy reports can be challenging. Address nicknames allow you to assign memorable names to addresses, making reports much easier to read.

**Privacy Guarantee**: Nicknames are stored locally on your device and are never sent to any server.

## Web UI

### Setting Nicknames

In the web scanner, you can set nicknames in two ways:

1. **Hover over any address** - Click "Nickname" to add or edit
2. **Click "Manage Nicknames"** - Open the nickname manager panel

When a nickname is set, addresses display as:
```
My Main Wallet (CG2j...Jwwb)
```

### Nickname Manager

Click the "Manage Nicknames" button above the address input to open the manager panel. From here you can:

- **Add new nicknames** - Enter an address and nickname
- **Edit existing nicknames** - Click "Edit" on any nickname
- **Remove nicknames** - Click "Remove" on any nickname
- **Search nicknames** - Filter by address or nickname
- **Export to JSON** - Download your nicknames as a backup
- **Import from JSON** - Restore nicknames from a backup file
- **Clear all** - Remove all nicknames

### Storage

Nicknames are stored in your browser's localStorage under the key `solana-privacy-scanner-nicknames`. They persist across browser sessions but are specific to each browser/device.

## CLI Usage

### Using a Nicknames File

Create a JSON file with your nicknames:

```json
{
  "version": "1.0.0",
  "nicknames": {
    "CG2j5yV6XokVsDBgGdgxUSi6jSAq6oq8J83LPivwJwwb": "My Main Wallet",
    "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9": "CEX Deposit"
  },
  "createdAt": 1706620800000,
  "updatedAt": 1706620800000
}
```

Then use the `--nicknames` flag:

```bash
solana-privacy-scanner scan-wallet <address> --nicknames ./my-nicknames.json
```

### Environment Variable

Set the `PRIVACY_SCANNER_NICKNAMES` environment variable to automatically load nicknames:

```bash
export PRIVACY_SCANNER_NICKNAMES=~/.solana-nicknames.json
solana-privacy-scanner scan-wallet <address>
```

### File Auto-Creation

If you specify a nicknames file that doesn't exist, the CLI will create an empty one:

```bash
solana-privacy-scanner scan-wallet <address> --nicknames ./new-nicknames.json
# Creates new-nicknames.json with empty nickname store
```

## JSON Format

The nickname store format is versioned for forward compatibility:

```typescript
interface NicknameStore {
  version: "1.0.0";
  nicknames: Record<string, string>; // address -> nickname
  createdAt: number;  // Unix timestamp (ms)
  updatedAt: number;  // Unix timestamp (ms)
}
```

### Validation Rules

- **Address**: Must be 32-44 characters (valid Solana address length)
- **Nickname**: 1-50 characters, automatically trimmed
- **No duplicates**: Each address can only have one nickname

## Library Usage

### Memory Provider

```typescript
import { createMemoryNicknameProvider } from 'solana-privacy-scanner-core';

const nicknames = createMemoryNicknameProvider();

// Set a nickname
nicknames.set('CG2j5yV6...', 'My Wallet');

// Get a nickname
const name = nicknames.get('CG2j5yV6...');
// Returns: 'My Wallet' or null

// Check if nickname exists
nicknames.has('CG2j5yV6...'); // true

// Remove a nickname
nicknames.remove('CG2j5yV6...');

// Get all nicknames
const all = nicknames.getAll(); // Map<string, string>

// Export for backup
const store = nicknames.export();
```

### File Provider (Node.js)

```typescript
import { createFileNicknameProvider } from 'solana-privacy-scanner-core';

// Auto-saves to file on every change
const nicknames = createFileNicknameProvider('./nicknames.json');

nicknames.set('CG2j5yV6...', 'My Wallet');
// File is automatically updated
```

### Display Address Utility

```typescript
import {
  displayAddress,
  getAddressDisplayInfo,
  createAddressFormatter,
} from 'solana-privacy-scanner-core';

// Simple display with priority: nickname > label > truncated
const display = displayAddress(address, {
  nicknames: nicknameProvider,
  labels: labelProvider,
});
// Returns: "My Wallet (CG2j...Jwwb)" or "Binance Hot Wallet" or "CG2j...Jwwb"

// Get structured info for custom rendering
const info = getAddressDisplayInfo(address, nicknames, labels);
// Returns: { type: 'nickname', displayText: 'My Wallet', ... }

// Create reusable formatter
const fmt = createAddressFormatter({ nicknames, truncateChars: 6 });
fmt(address1); // "My Wallet (CG2j5y...vwJwwb)"
fmt(address2); // "5tzFki...UvuAi9"
```

## Import/Export

### Export Nicknames

**Web UI**: Click "Export JSON" in the Nickname Manager

**Library**:
```typescript
const store = nicknames.export();
const json = JSON.stringify(store, null, 2);
// Save to file or download
```

### Import Nicknames

**Web UI**: Click "Import JSON" and select a file

**Library**:
```typescript
// Import without overwriting existing
nicknames.import(store, false);

// Import and overwrite conflicts
nicknames.import(store, true);
```

## Best Practices

1. **Backup regularly** - Export your nicknames periodically
2. **Use descriptive names** - "CEX Deposit" is better than "Wallet 2"
3. **Include purpose** - "Jupiter Swap Hot" tells you what it's for
4. **Share carefully** - Nicknames can reveal your wallet organization

## Privacy Considerations

- Nicknames never leave your device
- They're not included in scan reports
- Exported JSON files should be kept private
- Clear nicknames before sharing your browser/device
