# OIP-1: The ORRO URI Scheme

This document specifies the technical syntax for sharing trust actions over the internet.

* **Syntax:** `orro:<address>[?amount=<points>][&label=<label>][&message=<message>]`.

* **The Zero-Option Rule:** To prevent protocol bloat, all optional features (outside of the "Inspirational" metadata) must be kept to an absolute minimum. Implementations **MUST** ignore unknown parameters to maintain interoperability.

* **Human-Legibility:** Every URI is designed to be readable by a human, ensuring transparency before a user confirms a transaction in their wallet.
