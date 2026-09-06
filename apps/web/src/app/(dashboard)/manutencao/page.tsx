import ManutencaoView from "@/views/manutencao";
import { getMaintenanceItems } from "@/server/data/manutencao";
import { requireFamilySession } from "@/server/auth";

export default async function ManutencaoPage() {
  const { familyId } = await requireFamilySession();
  const items = await getMaintenanceItems(familyId);

  return <ManutencaoView items={items} />;
}
