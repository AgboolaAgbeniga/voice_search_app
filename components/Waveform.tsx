// ─── Waveform Component ───────────────────────────────────────────────────────

export function Waveform({ active }: { active: boolean }) {
  const bars = Array.from({ length: 32 }, (_, i) => i);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 48 }}>
      {bars.map((i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: active ? `${20 + Math.sin(i * 0.8) * 16}%` : "12%",
            background: active
              ? `rgba(56, 189, 248, ${0.4 + (Math.sin(i * 0.5) + 1) * 0.3})`
              : "rgba(56, 189, 248, 0.15)",
            borderRadius: 3,
            animation: active ? `wave-bar ${0.6 + (i % 5) * 0.12}s ease-in-out infinite` : "none",
            animationDelay: `${(i % 8) * 0.07}s`,
            transition: "height 0.3s ease, background 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}
