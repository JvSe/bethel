import ComprasView from "@/views/compras";
import { getShoppingItems } from "@/server/data/compras";
import { requireFamilySession } from "@/server/auth";

export default async function ComprasPage() {
  const { familyId } = await requireFamilySession();
  const items = await getShoppingItems(familyId);

  return <ComprasView items={items} />;
}
