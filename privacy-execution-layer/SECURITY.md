# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

### ⚠️ IMPORTANT
**DO NOT** create public GitHub issues for security vulnerabilities.

### Preferred Method: GitHub Security Advisories
1. Go to [Security Advisories](../../security/advisories)
2. Click "Report a vulnerability"
3. Fill out the form with details

### Alternative Method: Email
📧 **Email**: security@privacyexecutionlayer.org

Include:
- Detailed description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if any)

### PGP Key
For encrypted communication, use our PGP key:
```
[PGP KEY WILL BE ADDED]
```

## Response Timeline

| Stage | Timeframe |
|-------|-----------|
| Acknowledgment | 48 hours |
| Initial Assessment | 72 hours |
| Fix Development | 7-14 days |
| Public Disclosure | 90 days max |

## Bug Bounty Program

| Severity | Reward |
|----------|--------|
| **Critical** | Up to $1,000,000 |
| **High** | Up to $250,000 |
| **Medium** | Up to $50,000 |
| **Low** | Up to $10,000 |

### Scope

**In Scope:**
- Smart contracts (`programs/`)
- ZK circuits (`circuits/`)
- CLI tool (`cli/`)
- Economic attacks
- Privacy leaks

**Out of Scope:**
- Social engineering
- Physical attacks
- Third-party services
- Issues already reported

### Eligibility
- First reporter of the vulnerability
- Must follow responsible disclosure
- Must not exploit the vulnerability
- Must not be a current/former team member

## Security Measures

This project implements:
- ✅ Automated dependency scanning
- ✅ Static analysis (Clippy)
- ✅ Continuous security auditing
- ✅ Code review requirements
- ✅ Formal verification (planned)

## Audit Status

| Auditor | Status | Report |
|---------|--------|--------|
| TBD | Pending | - |

---

*Security is our top priority. Thank you for helping keep this protocol safe.*
