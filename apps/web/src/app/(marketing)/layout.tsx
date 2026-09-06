import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--ds-bg)",
        color: "var(--ds-text)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "20px 28px",
          maxWidth: 1080,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", color: "inherit" }}>
          <BrandMark />
          <div>
            <div
              style={{
                fontFamily: "var(--font-bricolage), sans-serif",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              Bethel
            </div>
            <div style={{ fontSize: 12, color: "var(--ds-muted)", marginTop: 3 }}>Gestão do lar</div>
          </div>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/login"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ds-text)",
              textDecoration: "none",
              padding: "8px 12px",
            }}
          >
            Entrar
          </Link>
          <Link
            href="/registro"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              background: "var(--ds-accent)",
              textDecoration: "none",
              padding: "10px 16px",
              borderRadius: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,.08)",
            }}
          >
            Começar grátis
          </Link>
        </nav>
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      <footer
        style={{
          maxWidth: 1080,
          width: "100%",
          margin: "0 auto",
          padding: "28px 28px 40px",
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "space-between",
          color: "var(--ds-muted)",
          fontSize: 13,
        }}
      >
        <span>Bethel — um lar organizado, uma fé compartilhada.</span>
        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/privacidade" style={{ color: "inherit", textDecoration: "none" }}>
            Privacidade
          </Link>
          <Link href="/termos" style={{ color: "inherit", textDecoration: "none" }}>
            Termos
          </Link>
        </div>
      </footer>
    </div>
  );
}
