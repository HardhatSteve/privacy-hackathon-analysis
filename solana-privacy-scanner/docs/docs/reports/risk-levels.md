# Risk Levels

## Three Levels

**🟢 LOW** - Minimal privacy exposure  
**🟡 MEDIUM** - Moderate patterns detected  
**🔴 HIGH** - Significant deanonymization risk

## Calculation

```
HIGH: 2+ HIGH signals OR (1 HIGH + 2 MEDIUM)
MEDIUM: 1 HIGH OR 2+ MEDIUM OR (1 MEDIUM + 2 LOW)
LOW: Few or no signals
```

## Signal Severity

- **HIGH** - Critical exploitable pattern (e.g., fee payer reuse, CEX interaction)
- **MEDIUM** - Moderate pattern (e.g., counterparty reuse, timing correlation)
- **LOW** - Minor pattern (e.g., occasional round amounts)

## Limitations

:::warning[Keep in Mind]
- **Not absolute**: Risk levels are indicators, not guarantees
- **Context-dependent**: Some patterns are normal in some contexts
- **Snapshot**: Based only on analyzed transactions
- **Conservative**: Designed to flag potential issues
:::
