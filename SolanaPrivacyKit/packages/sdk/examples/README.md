# Example proofs (demo)

Use with the CLI:

```bash
# From repo root, verify using mock backend (format-only validation)
privacy verify packages/sdk/examples/demo-proof.json

# Or verify a hex string
privacy verify deadbeef
```

- **demo-proof.json** – Demo proof for format validation (mock backend). Proof is a hex string; `publicInputs` can be empty or include commitment for ShadowWire Bulletproofs.
