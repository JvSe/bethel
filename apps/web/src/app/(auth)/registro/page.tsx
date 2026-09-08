"use client";

import { authClient } from "@bethel/auth/client";
import { isPasswordStrong } from "@bethel/auth/password";
import { formatPhone, isValidPhone } from "@bethel/auth/phone";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  buttonStyle,
  fieldStyle,
  footerTextStyle,
  inputStyle,
  labelStyle,
  linkStyle,
  secondaryButtonStyle,
  subtitleStyle,
  titleStyle,
} from "../form-styles";
import { PasswordRules } from "../password-rules";

const AVATAR_COLORS = ["#5878a8", "#c0764f", "#c79a3e", "#4f8a6b", "#8a5b86"];

function StepPills({ step }: { step: 1 | 2 }) {
  const items = [
    { n: 1 as const, label: "Dados" },
    { n: 2 as const, label: "Senha" },
  ];

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
      {items.map((item) => {
        const active = step === item.n;
        const done = step > item.n;
        return (
          <div
            key={item.n}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 600,
              color: active || done ? "var(--ds-text)" : "var(--ds-muted)",
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: active || done ? "var(--ds-accent)" : "var(--ds-soft)",
                color: active || done ? "#fff" : "var(--ds-muted)",
                fontSize: 12,
              }}
            >
              {done ? "✓" : item.n}
            </span>
            {item.label}
          </div>
        );
      })}
    </div>
  );
}

function RegistroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const convite = searchParams.get("convite");

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending || !session) return;
    if (convite) {
      router.replace(`/aceitar-convite?id=${convite}`);
      return;
    }
    void authClient.organization.list().then(({ data }) => {
      if (!data) {
        router.replace("/inicio");
        return;
      }
      router.replace(data.length > 0 ? "/inicio" : "/onboarding");
    });
  }, [session, isPending, convite, router]);

  function goToPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Informe o seu nome.");
      return;
    }
    if (!isValidPhone(phone)) {
      setError("Informe um telefone válido com DDD.");
      return;
    }
    setError(null);
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Aceite os termos e a política de privacidade para criar a conta.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    if (!isPasswordStrong(password)) {
      setError("A senha precisa ter letra, número e símbolo, com pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);

    const callbackURL = convite ? `/aceitar-convite?id=${convite}` : "/onboarding";
    const { error } = await authClient.signUp.email({
      name: name.trim().slice(0, 80),
      email,
      password,
      phone,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      callbackURL,
    });

    if (error) {
      setLoading(false);
      setError(
        error.code === "USER_ALREADY_EXISTS"
          ? "Já existe uma conta com este e-mail. Entre ou recupere a senha."
          : error.status === 500 || error.message === "Erro interno ao autenticar."
            ? "Não foi possível criar sua conta agora. Tente de novo em instantes."
            : (error.message ?? "Não foi possível criar sua conta. Tente de novo em instantes."),
      );
      return;
    }

    router.push(
      (convite ? `/verificar-email?convite=${encodeURIComponent(convite)}` : "/verificar-email") as Route,
    );
    if (typeof window !== "undefined") {
      sessionStorage.setItem("bethel-verify-email", email);
    }
    router.refresh();
  }

  return (
    <>
      <h1 style={titleStyle}>Criar conta</h1>
      <p style={subtitleStyle}>
        {convite ? "Crie sua conta para aceitar o convite da família." : "Comece a organizar a vida da sua família."}
      </p>
      <StepPills step={step} />
      {step === 1 ? (
        <form onSubmit={goToPassword}>
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="name">
              Nome
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              maxLength={80}
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
            <label style={labelStyle} htmlFor="phone">
              Telefone
            </label>
            <input
              id="phone"
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              placeholder="(11) 99999-9999"
              style={inputStyle}
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
            />
          </div>
          {error && <p style={{ color: "#b3452c", fontSize: 13, marginBottom: 14 }}>{error}</p>}
          <button type="submit" style={buttonStyle}>
            Continuar
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <PasswordRules password={password} />
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="confirm">
              Confirmar senha
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              style={inputStyle}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {confirm.length > 0 && password !== confirm && (
              <p style={{ color: "#b3452c", fontSize: 12, margin: "6px 0 0" }}>As senhas não conferem.</p>
            )}
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
          <button
            type="button"
            style={{ ...secondaryButtonStyle, marginTop: 10 }}
            onClick={() => {
              setError(null);
              setStep(1);
            }}
          >
            Voltar
          </button>
        </form>
      )}
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
