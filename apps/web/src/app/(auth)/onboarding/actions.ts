"use server";

import { revalidatePath } from "next/cache";
import { requireFamilySession } from "@/server/auth";
import { provisionNewFamily } from "@/server/data/provision";

type ActionResult = { success: true } | { success: false; error: string };

export async function provisionNewFamilyAction(): Promise<ActionResult> {
  const { familyId } = await requireFamilySession();

  try {
    await provisionNewFamily(familyId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível preparar a família.",
    };
  }

  revalidatePath("/inicio");
  return { success: true };
}
