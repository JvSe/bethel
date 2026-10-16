import LancamentosView from "@/views/lancamentos";
import { getFinanceOverview } from "@/server/data/financas";
import { requireFamilySession } from "@/server/auth";

export default async function ReceitasPage() {
  const { familyId } = await requireFamilySession();
  const overview = await getFinanceOverview(familyId);

  return <LancamentosView kind="INCOME" transactions={overview.transactions} />;
}
