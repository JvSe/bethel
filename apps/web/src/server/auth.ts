import { auth } from "@bethel/auth";
import prisma from "@bethel/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function requireFamilySession() {
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
  };
}
