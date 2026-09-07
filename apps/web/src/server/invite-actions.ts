"use server";

import { auth } from "@bethel/auth";
import { headers } from "next/headers";
import { requireFamilyAction } from "@/server/auth";
import { emailSchema } from "@/server/validators/common";

type InviteResult = { success: true; invitationId: string } | { success: false; error: string };

export async function inviteMemberAction(email: string): Promise<InviteResult> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Informe um e-mail válido." };
  }

  const authz = await requireFamilyAction();
  if (!authz.success) return authz;
  if (!authz.session.isOwner) {
    return { success: false, error: "Você não tem permissão para convidar membros." };
  }

  try {
    const invitation = await auth.api.createInvitation({
      body: {
        email: parsed.data,
        role: "member",
        organizationId: authz.session.familyId,
      },
      headers: await headers(),
    });

    if (!invitation?.id) {
      return { success: false, error: "Não foi possível criar o convite." };
    }

    return { success: true, invitationId: invitation.id };
  } catch {
    return { success: false, error: "Não foi possível criar o convite." };
  }
}
