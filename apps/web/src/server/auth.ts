import { auth } from "@bethel/auth";
import prisma from "@bethel/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { consumeMutationRateLimit } from "@/server/rate-limit";

export type FamilySession = {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
  };
  familyId: string;
  role: string;
  isOwner: boolean;
};

async function findMembership(userId: string, preferredOrgId?: string | null) {
  if (preferredOrgId) {
    const preferred = await prisma.member.findFirst({
      where: { userId, organizationId: preferredOrgId },
    });
    if (preferred) return preferred;
  }

  return prisma.member.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function requireFamilySession(): Promise<FamilySession> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const member = await findMembership(session.user.id, session.session.activeOrganizationId);
  if (!member) redirect("/onboarding");

  return {
    userId: session.user.id,
    user: session.user,
    familyId: member.organizationId,
    role: member.role,
    isOwner: member.role === "owner",
  };
}

export async function requireFamilyAction(): Promise<
  { success: true; session: FamilySession } | { success: false; error: string }
> {
  const session = await requireFamilySession();
  if (await consumeMutationRateLimit(session.userId)) {
    return { success: false, error: "Muitas tentativas. Espere um minuto e tente de novo." };
  }
  return { success: true, session };
}

export async function requireOnboardingSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const member = await findMembership(session.user.id, session.session.activeOrganizationId);
  if (member) redirect("/inicio");

  return session;
}
