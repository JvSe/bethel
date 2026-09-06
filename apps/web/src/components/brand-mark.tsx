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
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 11 L12 4 L20 11" />
        <path d="M6 10 V20 H18 V10" />
      </svg>
    </div>
  );
}
