"use client";

import { authClient } from "@bethel/auth/client";
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
  subtitleStyle,
  titleStyle,
} from "../form-styles";

function loginErrorMessage(error: {
  code?: string | undefined;
  status?: number;
  message?: string;
}) {
  if (error.code === "EMAIL_NOT_VERIFIED") {
    return "Confirme seu e-mail para entrar. Olhe a caixa de entrada e o spam.";
  }
  if (error.code === "TOO_MANY_REQUESTS" || error.status === 429) {
    return "Muitas tentativas. Espere um minuto e tente de novo.";
  }
  if (error.status === 500 || error.message === "Erro interno ao autenticar.") {
    return "Não foi possível entrar agora. Tente de novo em instantes.";
  }
  return "E-mail ou senha inválidos.";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const convite = searchParams.get("convite");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await authClient.signIn.email({ email, password });

    if (error) {
      setLoading(false);
      setError(loginErrorMessage(error));
      return;
    }

    if (convite) {
      router.push(`/aceitar-convite?id=${convite}`);
      router.refresh();
      return;
    }

    const { data: organizations } = await authClient.organization.list();
    if (organizations && organizations.length > 0) {
      await authClient.organization.setActive({
        organizationId: organizations[0].id,
      });
      router.push("/inicio");
    } else {
      router.push("/onboarding");
    }
    router.refresh();
  }

  return (
    <>
      <h1 style={titleStyle}>Entrar</h1>
      <p style={subtitleStyle}>Acesse a gestão da sua família.</p>
      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="exemplo@email.com"
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
            placeholder="********"
            autoComplete="current-password"
            style={inputStyle}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p style={{ color: "#b3452c", fontSize: 13, marginBottom: 14 }}>
            {error}
          </p>
        )}
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p style={{ ...footerTextStyle, marginTop: 12 }}>
        <Link href="/esqueci-senha" style={linkStyle}>
          Esqueci a senha
        </Link>
      </p>
      <p style={footerTextStyle}>
        Ainda não tem conta?{" "}
        <Link
          href={convite ? `/registro?convite=${convite}` : "/registro"}
          style={linkStyle}
        >
          Cadastre-se
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
