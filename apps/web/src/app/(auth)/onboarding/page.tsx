"use client";

import { authClient } from "@bethel/auth/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { provisionNewFamilyAction } from "./actions";
import { buttonStyle, fieldStyle, inputStyle, labelStyle, subtitleStyle, titleStyle } from "../form-styles";

function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const slug = `${slugify(name)}-${crypto.randomUUID().slice(0, 6)}`;
    const { data, error } = await authClient.organization.create({ name, slug });

    if (error || !data?.id) {
      setLoading(false);
      setError(error?.message ?? "Não foi possível criar a família.");
      return;
    }

    await authClient.organization.setActive({ organizationId: data.id });
    const provisioned = await provisionNewFamilyAction();
    if (!provisioned.success) {
      setLoading(false);
      setError(provisioned.error);
      return;
    }

    router.push("/inicio");
    router.refresh();
  }

  return (
    <>
      <h1 style={titleStyle}>Crie sua família</h1>
      <p style={subtitleStyle}>Dê um nome para a sua família no Bethel. Você poderá convidar os demais membros depois.</p>
      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="name">
            Nome da família
          </label>
          <input
            id="name"
            type="text"
            required
            placeholder="Família Nunes"
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        {error && <p style={{ color: "#b3452c", fontSize: 13, marginBottom: 14 }}>{error}</p>}
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "Criando..." : "Criar família"}
        </button>
      </form>
    </>
  );
}
