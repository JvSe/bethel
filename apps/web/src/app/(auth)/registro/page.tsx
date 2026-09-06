"use client";

import { authClient } from "@bethel/auth/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  buttonStyle,
  fieldStyle,
  footerTextStyle,
  inputStyle,
  labelStyle,
  linkStyle,
  subtitleStyle,
  titleStyle,
} from "../form-styles";

const AVATAR_COLORS = ["#5878a8", "#c0764f", "#c79a3e", "#4f8a6b", "#8a5b86"];

function RegistroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const convite = searchParams.get("convite");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Aceite os termos e a política de privacidade para criar a conta.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    });

    if (error) {
      setLoading(false);
      setError(error.message ?? "Não foi possível criar sua conta.");
      return;
    }

    router.push(convite ? `/aceitar-convite?id=${convite}` : "/onboarding");
    router.refresh();
  }

  return (
    <>
      <h1 style={titleStyle}>Criar conta</h1>
      <p style={subtitleStyle}>
        {convite ? "Crie sua conta para aceitar o convite da família." : "Comece a organizar a vida da sua família."}
      </p>
      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="name">
            Nome
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            style={inputStyle}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            style={inputStyle}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div style={{ ...fieldStyle, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <input
            id="terms"
            type="checkbox"
            required
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            style={{ marginTop: 3 }}
          />
          <label htmlFor="terms" style={{ fontSize: 13, color: "var(--ds-muted)", lineHeight: 1.45 }}>
            Li e aceito os{" "}
            <Link href="/termos" style={linkStyle} target="_blank">
              Termos de uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" style={linkStyle} target="_blank">
              Política de privacidade
            </Link>
            .
          </label>
        </div>
        {error && <p style={{ color: "#b3452c", fontSize: 13, marginBottom: 14 }}>{error}</p>}
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>
      <p style={footerTextStyle}>
        Já tem conta?{" "}
        <Link href={convite ? `/login?convite=${convite}` : "/login"} style={linkStyle}>
          Entrar
        </Link>
      </p>
    </>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={null}>
      <RegistroForm />
    </Suspense>
  );
}
