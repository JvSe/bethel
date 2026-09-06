import prisma from "@bethel/db";
import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { DashboardProvider } from "@/contexts/dashboard-context";
import { requireFamilySession } from "@/server/auth";
import { familyNeedsProvision, provisionNewFamily } from "@/server/data/provision";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId, familyId, role } = await requireFamilySession();

  if (await familyNeedsProvision(familyId)) {
    await provisionNewFamily(familyId);
  }

  const family = await prisma.organization.findUnique({
    where: { id: familyId },
    include: { members: { include: { user: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!family) redirect("/onboarding");

  const members = family.members.map((m) => ({
    memberId: m.id,
    userId: m.userId,
    name: m.user.name,
    avatarColor: m.user.avatarColor ?? "#9a958b",
    role: m.role,
  }));

  return (
    <DashboardProvider>
      <div className="dashboard-shell" style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--ds-bg)" }}>
        <Sidebar familyId={familyId} familyName={family.name} members={members} isOwner={role === "owner"} currentUserId={userId} />
        <main className="dashboard-main" style={{ flex: 1, overflowY: "auto", height: "100vh" }}>{children}</main>
      </div>
    </DashboardProvider>
  );
}
