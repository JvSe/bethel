"use server";

import { revalidatePath } from "next/cache";
import { requireFamilyAction } from "@/server/auth";
import { provisionNewFamily } from "@/server/data/provision";

type ActionResult = { success: true } | { success: false; error: string };

export async function provisionNewFamilyAction(): Promise<ActionResult> {
  const authz = await requireFamilyAction();
  if (!authz.success) return authz;

  try {
    await provisionNewFamily(authz.session.familyId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível preparar a família.",
    };
  }

  revalidatePath("/inicio");
  return { success: true };
}
