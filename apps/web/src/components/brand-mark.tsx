import { Home } from "reicon-react";

export function BrandMark({ size = 38 }: { size?: number }) {
  const icon = Math.round(size * 0.53);

  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: Math.round(size * 0.29),
        background: "var(--ds-accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}
    >
      <Home size={icon} />
    </div>
  );
}
