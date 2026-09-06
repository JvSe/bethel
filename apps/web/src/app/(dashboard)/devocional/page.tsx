import DevocionalView from "@/views/devocional";
import { getDevotionalOverview } from "@/server/data/devocional";
import { requireFamilySession } from "@/server/auth";

export default async function DevocionalPage() {
  const { familyId, userId } = await requireFamilySession();
  const overview = await getDevotionalOverview(familyId, userId);

  return <DevocionalView overview={overview} />;
}
