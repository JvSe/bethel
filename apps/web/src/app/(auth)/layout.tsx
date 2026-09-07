import { Home } from "reicon-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        padding: 24,
        background: "var(--ds-bg)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div
          style={{
            width: 42,
            height: 42,
            flexShrink: 0,
            borderRadius: 12,
            background: "var(--ds-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          <Home size={22} />
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-bricolage), sans-serif",
              fontWeight: 700,
              fontSize: 19,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              color: "var(--ds-text)",
            }}
          >
            Bethel
          </div>
          <div style={{ fontSize: 12, color: "var(--ds-muted)", marginTop: 3 }}>Gestão do lar</div>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--ds-surface)",
          border: "1px solid var(--ds-border)",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 4px 24px rgba(0,0,0,.05)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
