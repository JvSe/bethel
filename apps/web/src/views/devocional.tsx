import TopBar from "@/components/top-bar";
import { formatLongDate } from "@/lib/format";
import type { DailyVerse } from "@/lib/daily-verse";
import Link from "next/link";

function BookIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5 H10 A2 2 0 0 1 12 7 V20 A2 2 0 0 0 10 18 H4 Z" />
      <path d="M20 5 H14 A2 2 0 0 0 12 7 V20 A2 2 0 0 1 14 18 H20 Z" />
    </svg>
  );
}

interface DevocionalViewProps {
  verse: DailyVerse;
}

export default function DevocionalView({ verse }: DevocionalViewProps) {
  return (
    <>
      <TopBar title="Versículo do dia" subtitle={formatLongDate(new Date())} />
      <div className="ds-page" style={{ padding: "26px 36px 56px" }}>
        <div className="ds-cols-2" style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: 16, alignItems: "start" }}>
          <div
            style={{
              background: "var(--ds-surface)",
              border: "1px solid var(--ds-border)",
              borderLeft: "4px solid #c79a3e",
              borderRadius: 18,
              boxShadow: "0 1px 2px rgba(30,28,24,.03)",
              padding: "30px 34px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "#c79a3e" }}>
              <BookIcon size={15} />
              Palavra de hoje
            </div>
            <p
              style={{
                fontFamily: "var(--font-bricolage), sans-serif",
                fontWeight: 600,
                fontSize: 25,
                letterSpacing: "-0.01em",
                lineHeight: 1.45,
                margin: "18px 0 0",
                color: "var(--ds-text)",
              }}
            >
              {verse.text}
            </p>
            <div style={{ marginTop: 22, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ds-text)" }}>{verse.reference}</span>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "var(--ds-muted)" }}>
                {verse.versionLabel}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                background: "rgba(199,154,62,.1)",
                border: "1px solid var(--ds-border)",
                borderRadius: 16,
                padding: "22px 24px",
              }}
            >
              <h3 style={{ margin: "0 0 10px", fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Para refletir hoje</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--ds-text)" }}>
                Em que área da nossa casa precisamos confiar mais em Deus esta semana?
              </p>
            </div>
            <div
              style={{
                background: "var(--ds-surface)",
                border: "1px solid var(--ds-border)",
                borderRadius: 16,
                boxShadow: "0 1px 2px rgba(30,28,24,.03)",
                padding: "22px 24px",
              }}
            >
              <h3 style={{ margin: "0 0 10px", fontSize: 15.5, fontWeight: 700, color: "var(--ds-text)" }}>Momento em família</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13.5, lineHeight: 1.6, color: "var(--ds-muted)" }}>
                Depois do jantar, leiam juntos o versículo do dia e cada um compartilha uma palavra que tocou o coração.
              </p>
              <Link
                href="/oracao"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: "#c79a3e",
                  color: "#fff",
                  borderRadius: 11,
                  padding: 11,
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                Ir para o mural de oração
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
