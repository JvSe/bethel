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

export async function requireFamilySession(): Promise<FamilySession> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const familyId = session.session.activeOrganizationId;
  if (!familyId) redirect("/onboarding");

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id, organizationId: familyId },
  });
  if (!member) redirect("/onboarding");

  return {
    userId: session.user.id,
    user: session.user,
    familyId,
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
