"use client";

import { authClient } from "@bethel/auth/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { buttonStyle, footerTextStyle, linkStyle, subtitleStyle, titleStyle } from "../form-styles";

function VerificarEmailContent() {
  const searchParams = useSearchParams();
  const convite = searchParams.get("convite");
  const { data: session } = authClient.useSession();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [storedEmail, setStoredEmail] = useState<string | null>(null);
  const email = session?.user.email ?? storedEmail;

  useEffect(() => {
    setStoredEmail(sessionStorage.getItem("bethel-verify-email"));
  }, []);

  async function resend() {
    if (!email) return;
    setSending(true);
    await authClient.sendVerificationEmail({
      email,
      callbackURL: convite ? `/aceitar-convite?id=${convite}` : "/onboarding",
    });
    setSending(false);
    setSent(true);
  }

  return (
    <>
      <h1 style={titleStyle}>Confirme seu e-mail</h1>
      <p style={subtitleStyle}>
        Enviamos um link de confirmação. Sem isso, não dá para entrar nem aceitar um convite da família. Olhe também a
        caixa de spam.
      </p>
      {email && (
        <button type="button" style={buttonStyle} disabled={sending} onClick={() => void resend()}>
          {sent ? "Link reenviado" : sending ? "Enviando..." : "Reenviar e-mail"}
        </button>
      )}
      <p style={footerTextStyle}>
        Já confirmou?{" "}
        <Link href={convite ? `/login?convite=${encodeURIComponent(convite)}` : "/login"} style={linkStyle}>
          Entrar
        </Link>
      </p>
    </>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerificarEmailContent />
    </Suspense>
  );
}
