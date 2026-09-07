"use client";

import { authClient } from "@bethel/auth/client";
import Link from "next/link";
import { useState } from "react";
import { buttonStyle, fieldStyle, footerTextStyle, inputStyle, labelStyle, linkStyle, subtitleStyle, titleStyle } from "../form-styles";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await authClient.requestPasswordReset({
      email,
      redirectTo: "/redefinir-senha",
    });

    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <>
        <h1 style={titleStyle}>Confira seu e-mail</h1>
        <p style={subtitleStyle}>
          Se existir uma conta com esse endereço, enviamos um link para criar uma senha nova. Olhe também a caixa de spam.
        </p>
        <p style={footerTextStyle}>
          <Link href="/login" style={linkStyle}>
            Voltar ao login
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 style={titleStyle}>Esqueci a senha</h1>
      <p style={subtitleStyle}>Informe o e-mail da sua conta. Enviamos um link para redefinir a senha.</p>
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
            style={inputStyle}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "Enviando..." : "Enviar link"}
        </button>
      </form>
      <p style={footerTextStyle}>
        <Link href="/login" style={linkStyle}>
          Voltar ao login
        </Link>
      </p>
    </>
  );
}
