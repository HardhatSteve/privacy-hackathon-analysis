"use client";

export function DemoCard() {
  return (
    <div
      style={{
        border: "1px solid #333",
        borderRadius: "8px",
        padding: "1.5rem",
        background: "#111",
      }}
    >
      <h2 style={{ fontSize: "1.125rem", marginBottom: "0.75rem" }}>
        SDK Demo
      </h2>
      <p style={{ color: "#aaa", fontSize: "0.875rem" }}>
        Use <code style={{ background: "#222", padding: "0.2em 0.4em" }}>@privacy-devkit/sdk</code> in this app for client config, transfers, and proofs.
      </p>
    </div>
  );
}
