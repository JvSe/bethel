import OracaoView from "@/views/oracao";
import { getPrayerRequests } from "@/server/data/oracao";
import { requireFamilySession } from "@/server/auth";

export default async function OracaoPage() {
  const { familyId } = await requireFamilySession();
  const requests = await getPrayerRequests(familyId);

  return <OracaoView requests={requests} />;
}
