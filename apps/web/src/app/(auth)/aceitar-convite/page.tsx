"use client";

import { authClient } from "@bethel/auth/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { buttonStyle, footerTextStyle, linkStyle, subtitleStyle, titleStyle } from "../form-styles";

type Status = "checking" | "accepting" | "success" | "error" | "no-session" | "invalid";

function AceitarConviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("id");
  const { data: session, isPending } = authClient.useSession();
  const [status, setStatus] = useState<Status>("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (!invitationId) {
      setStatus("invalid");
      return;
    }
    if (isPending) return;
    if (!session) {
      setStatus("no-session");
      return;
    }
    if (attempted.current) return;
    attempted.current = true;
    setStatus("accepting");

    authClient.organization.acceptInvitation({ invitationId }).then(({ error }) => {
      if (error) {
        setStatus("error");
        setErrorMessage(
          error.code === "YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION"
            ? "Este convite foi enviado para outro e-mail. Entre com o e-mail que recebeu o convite."
            : "Este convite não é mais válido — ele pode ter expirado ou já ter sido usado.",
        );
        return;
      }
      setStatus("success");
      setTimeout(() => {
        router.push("/inicio");
        router.refresh();
      }, 1200);
    });
  }, [invitationId, isPending, session, router]);

  if (status === "invalid") {
    return (
      <>
        <h1 style={titleStyle}>Convite inválido</h1>
        <p style={subtitleStyle}>O link de convite está incompleto ou incorreto.</p>
      </>
    );
  }

  if (status === "no-session") {
    return (
      <>
        <h1 style={titleStyle}>Você foi convidado para uma família</h1>
        <p style={subtitleStyle}>Entre ou cadastre-se com o e-mail que recebeu o convite para participar.</p>
        <Link
          href={`/login?convite=${invitationId}`}
          style={{ ...buttonStyle, display: "block", textAlign: "center", textDecoration: "none", marginBottom: 10 }}
        >
          Entrar
        </Link>
        <p style={footerTextStyle}>
          Ainda não tem conta?{" "}
          <Link href={`/registro?convite=${invitationId}`} style={linkStyle}>
            Cadastre-se
          </Link>
        </p>
      </>
    );
  }

  if (status === "error") {
    return (
      <>
        <h1 style={titleStyle}>Não foi possível aceitar o convite</h1>
        <p style={{ color: "#b3452c", fontSize: 13.5 }}>{errorMessage}</p>
      </>
    );
  }

  if (status === "success") {
    return (
      <>
        <h1 style={titleStyle}>Convite aceito!</h1>
        <p style={subtitleStyle}>Redirecionando para o painel da família...</p>
      </>
    );
  }

  return (
    <>
      <h1 style={titleStyle}>Aceitando convite...</h1>
      <p style={subtitleStyle}>Só um instante.</p>
    </>
  );
}

export default function AceitarConvitePage() {
  return (
    <Suspense fallback={null}>
      <AceitarConviteContent />
    </Suspense>
  );
}
