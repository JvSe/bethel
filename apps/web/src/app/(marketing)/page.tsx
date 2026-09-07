import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Bethel — Gestão do lar para a família",
  description: "Organize as finanças, as tarefas e a vida de fé da sua família em um só lugar.",
};

const features = [
  {
    title: "Casa em ordem",
    text: "Finanças, contas, compras, despensa, tarefas e manutenção — o essencial do dia a dia, visível para toda a família.",
  },
  {
    title: "Vida de fé",
    text: "Versículo do dia, mural de oração e um diário de gratidão para caminharem juntos.",
  },
  {
    title: "Um espaço só da sua casa",
    text: "Cada família tem o seu lar digital. Você convida cônjuge e filhos com um link, sem misturar com outras casas.",
  },
  {
    title: "Simples no celular",
    text: "Abra no navegador do telefone ou do computador. Sem loja de aplicativos, sem mensalidade neste lançamento.",
  },
];

export default function LandingPage() {
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "12px 28px 64px" }}>
      <section style={{ padding: "36px 0 48px", maxWidth: 720 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ds-accent)",
          }}
        >
          Para a sua família
        </p>
        <h1
          style={{
            margin: "14px 0 16px",
            fontFamily: "var(--font-bricolage), sans-serif",
            fontWeight: 700,
            fontSize: "clamp(32px, 5vw, 48px)",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
          }}
        >
          A gestão do lar, com a fé no centro.
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: 18, lineHeight: 1.55, color: "var(--ds-muted)", maxWidth: 560 }}>
          O Bethel reúne as contas da casa, as tarefas de cada um e os hábitos de fé da família — num espaço simples,
          privado e feito para o dia a dia.
        </p>
        <div className="marketing-hero-actions">
          <Link
            href="/registro"
            style={{
              display: "inline-block",
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              background: "var(--ds-accent)",
              textDecoration: "none",
              padding: "13px 20px",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,.08)",
            }}
          >
            Começar grátis
          </Link>
          <Link
            href="/login"
            style={{
              display: "inline-block",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--ds-text)",
              background: "var(--ds-surface)",
              border: "1px solid var(--ds-border)",
              textDecoration: "none",
              padding: "13px 20px",
              borderRadius: 12,
            }}
          >
            Já tenho conta
          </Link>
        </div>
      </section>

      <section className="marketing-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {features.map((feature) => (
          <article
            key={feature.title}
            style={{
              background: "var(--ds-surface)",
              border: "1px solid var(--ds-border)",
              borderRadius: 16,
              padding: "22px 24px",
              boxShadow: "0 1px 2px rgba(30,28,24,.03)",
            }}
          >
            <h2
              style={{
                margin: "0 0 8px",
                fontFamily: "var(--font-bricolage), sans-serif",
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              {feature.title}
            </h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--ds-muted)" }}>{feature.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
