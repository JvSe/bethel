import TarefasView from "@/views/tarefas";
import { getFamilyMembers } from "@/server/data/family";
import { getTasks } from "@/server/data/tasks";
import { requireFamilySession } from "@/server/auth";

export default async function TarefasPage() {
  const { familyId } = await requireFamilySession();
  const [tasks, members] = await Promise.all([getTasks(familyId), getFamilyMembers(familyId)]);

  return <TarefasView tasks={tasks} members={members} />;
}
