import { requireOnboardingSession } from "@/server/auth";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  await requireOnboardingSession();
  return children;
}
