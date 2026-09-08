"use client";

import { authClient } from "@bethel/auth/client";
import { isPasswordStrong } from "@bethel/auth/password";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { buttonStyle, fieldStyle, footerTextStyle, inputStyle, labelStyle, linkStyle, subtitleStyle, titleStyle } from "../form-styles";
import { PasswordRules } from "../password-rules";

function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
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

    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    if (error) {
      setLoading(false);
      setError(error.message ?? "Este link expirou ou já foi usado. Peça um novo.");
      return;
    }

    router.push("/login");
    router.refresh();
  }

  if (!token) {
    return (
      <>
        <h1 style={titleStyle}>Link inválido</h1>
        <p style={subtitleStyle}>Este endereço não tem um código de redefinição. Peça um novo e-mail.</p>
        <p style={footerTextStyle}>
          <Link href="/esqueci-senha" style={linkStyle}>
            Enviar outro link
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 style={titleStyle}>Nova senha</h1>
      <p style={subtitleStyle}>Escolha uma senha com letra, número e símbolo.</p>
      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="password">
            Nova senha
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
            autoComplete="new-password"
            style={inputStyle}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {confirm.length > 0 && password !== confirm && (
            <p style={{ color: "#b3452c", fontSize: 12, margin: "6px 0 0" }}>As senhas não conferem.</p>
          )}
        </div>
        {error && <p style={{ color: "#b3452c", fontSize: 13, marginBottom: 14 }}>{error}</p>}
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "Salvando..." : "Salvar senha"}
        </button>
      </form>
    </>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenhaForm />
    </Suspense>
  );
}
