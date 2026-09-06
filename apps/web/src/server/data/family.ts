import prisma from "@bethel/db";

export async function getFamilyMembers(familyId: string) {
  const members = await prisma.member.findMany({
    where: { organizationId: familyId },
    include: { user: { select: { id: true, name: true, avatarColor: true } } },
    orderBy: { createdAt: "asc" },
  });

  return members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    avatarColor: m.user.avatarColor ?? "#9a958b",
  }));
}
