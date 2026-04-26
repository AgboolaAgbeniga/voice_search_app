// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner() {
  return (
    <div style={{
      width: 20,
      height: 20,
      borderRadius: "50%",
      border: "2px solid rgba(56,189,248,0.15)",
      borderTopColor: "var(--accent)",
      animation: "spin-slow 0.7s linear infinite",
      display: "inline-block",
    }} />
  );
}
