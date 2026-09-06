import InícioView from "@/views/inicio";
import { getHomeOverview } from "@/server/data/inicio";
import { requireFamilySession } from "@/server/auth";

export default async function InícioPage() {
  const { familyId, userId, user } = await requireFamilySession();
  const overview = await getHomeOverview(familyId, userId);

  return <InícioView overview={overview} userName={user.name ?? ""} />;
}
