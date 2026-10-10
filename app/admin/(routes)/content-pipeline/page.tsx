import type { Metadata } from "next";

import {
  ContentPipelineDashboard,
} from "@/components/admin/content-pipeline/content-pipeline-dashboard";
import { getContentPipelineScheduleState } from "@/lib/content-pipeline/scheduling";
import { getPipelineRecipes } from "@/lib/content-pipeline/pipeline-recipes";
import { getSocialSetupStatus } from "@/lib/content-pipeline/social-setup";

export const metadata: Metadata = {
  title: "Content Pipeline",
};

export const dynamic = "force-dynamic";

export default async function ContentPipelinePage() {
  const [recipes, scheduleState, socialSetup] = await Promise.all([
    getPipelineRecipes({ limit: 30 }),
    getContentPipelineScheduleState(),
    getSocialSetupStatus(),
  ]);

  return (
    <ContentPipelineDashboard
      recipes={recipes}
      initialSocialSetup={socialSetup}
      initialScheduledPosts={scheduleState.scheduledPosts}
      initialAutomationRules={scheduleState.automationRules}
    />
  );
}
