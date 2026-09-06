import prisma, { PantryLevel, TaskStatus } from "@bethel/db";
import { getFinanceOverview } from "@/server/data/financas";
import { getShoppingItems } from "@/server/data/compras";
import { getTasks } from "@/server/data/tasks";
import { getPantryItems } from "@/server/data/despensa";
import { getMaintenanceItems } from "@/server/data/manutencao";
import { getDevotionalOverview } from "@/server/data/devocional";

const PANTRY_SEVERITY: Record<PantryLevel, number> = { OUT: 0, LOW: 1, OK: 2 };

export async function getHomeOverview(familyId: string, userId: string) {
  const [organization, finance, shoppingItems, tasks, pantryItems, maintenanceItems, devotional] = await Promise.all([
    prisma.organization.findUnique({ where: { id: familyId }, select: { name: true } }),
    getFinanceOverview(familyId),
    getShoppingItems(familyId),
    getTasks(familyId),
    getPantryItems(familyId),
    getMaintenanceItems(familyId),
    getDevotionalOverview(familyId, userId),
  ]);

  const pendingShoppingItems = shoppingItems.filter((item) => !item.checked);
  const shoppingEstimatedTotal = pendingShoppingItems.reduce((sum, item) => sum + (item.estimatedPrice ?? 0), 0);

  const openTasks = tasks.filter((task) => task.status !== TaskStatus.DONE);
  const doneTasksCount = tasks.length - openTasks.length;

  const unpaidBills = finance.bills.filter((bill) => !bill.paid);
  const unpaidBillsTotal = unpaidBills.reduce((sum, bill) => sum + bill.amount, 0);

  const lowPantryItems = pantryItems
    .filter((item) => item.level !== PantryLevel.OK)
    .sort((a, b) => PANTRY_SEVERITY[a.level] - PANTRY_SEVERITY[b.level]);

  return {
    familyName: organization?.name ?? "Família",
    balance: finance.balance,
    unpaidBillsCount: unpaidBills.length,
    unpaidBillsTotal,
    pendingShoppingCount: pendingShoppingItems.length,
    shoppingEstimatedTotal,
    openTasksCount: openTasks.length,
    doneTasksCount,
    budget: finance.budget,
    upcomingBills: unpaidBills.slice(0, 5),
    devotional,
    todayTasks: openTasks.slice(0, 5),
    lowPantryItems: lowPantryItems.slice(0, 4),
    upcomingMaintenance: maintenanceItems.slice(0, 4),
  };
}
