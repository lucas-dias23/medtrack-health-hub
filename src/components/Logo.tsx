export function Logo({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={`font-display text-2xl font-bold ${className}`}>
      <span style={{ color: dark ? "#1a1a2e" : "hsl(var(--primary))" }}>Med</span>
      <span style={{ color: "#2D6BE4" }}>Track</span>
    </span>
  );
}
