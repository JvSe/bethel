import FinancasView from "@/views/financas";
import { getFinanceOverview } from "@/server/data/financas";
import { requireFamilySession } from "@/server/auth";

export default async function FinancasPage() {
  const { familyId } = await requireFamilySession();
  const overview = await getFinanceOverview(familyId);

  return <FinancasView {...overview} />;
}
