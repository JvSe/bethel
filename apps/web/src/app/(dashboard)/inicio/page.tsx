import InícioView from "@/views/inicio";
import { getHomeOverview } from "@/server/data/inicio";
import { requireFamilySession } from "@/server/auth";

export default async function InícioPage() {
  const { familyId, user } = await requireFamilySession();
  const overview = await getHomeOverview(familyId);

  return <InícioView overview={overview} userName={user.name ?? ""} />;
}
