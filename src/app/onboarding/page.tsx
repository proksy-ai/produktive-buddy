import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { getOnboardingContextForUser } from "@/lib/onboarding";

import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const context = await getOnboardingContextForUser(
    session.id,
    session.batchId,
  );

  if (!context) {
    redirect("/login");
  }

  if (context.user.onboardingCompleted) {
    redirect("/today");
  }

  return <OnboardingWizard initial={context} />;
}
