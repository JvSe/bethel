import DespensaView from "@/views/despensa";
import { getPantryItems } from "@/server/data/despensa";
import { requireFamilySession } from "@/server/auth";

export default async function DespensaPage() {
  const { familyId } = await requireFamilySession();
  const items = await getPantryItems(familyId);

  return <DespensaView items={items} />;
}
