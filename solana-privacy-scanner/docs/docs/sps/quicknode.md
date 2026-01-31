# Powered by QuickNode

Scanner uses [QuickNode](https://www.quicknode.com/) for reliable Solana RPC (99.9% uptime, \<100ms response).

## Default vs Custom

**Default (included)** - Perfect for development, testing, personal projects. No setup needed.

**Custom (production)** - Get your own [QuickNode endpoint](https://www.quicknode.com/) for commercial use:

```typescript
import { RPCClient } from 'solana-privacy-scanner-core';

const rpc = new RPCClient('https://your-endpoint.com');
```
