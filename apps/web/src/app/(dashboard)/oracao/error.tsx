"use client";

export default function OracaoError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ padding: "56px 36px", textAlign: "center" }}>
      <h2
        style={{
          fontFamily: "var(--font-bricolage), sans-serif",
          fontSize: 20,
          fontWeight: 700,
          color: "var(--ds-text)",
        }}
      >
        Não foi possível carregar o mural de oração
      </h2>
      <p style={{ color: "var(--ds-muted)", fontSize: 14, marginTop: 8 }}>Tente novamente em instantes.</p>
      <button
        onClick={() => reset()}
        style={{
          marginTop: 20,
          background: "var(--ds-accent)",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "10px 20px",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Tentar novamente
      </button>
    </div>
  );
}
