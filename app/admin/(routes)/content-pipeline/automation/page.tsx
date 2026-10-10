import type { Metadata } from "next";

import { ContentAutomationDashboard } from "@/components/admin/content-pipeline/content-automation-dashboard";
import { getContentPipelineScheduleState } from "@/lib/content-pipeline/scheduling";

export const metadata: Metadata = {
  title: "Content Automation",
};

export const dynamic = "force-dynamic";

export default async function ContentAutomationPage() {
  const scheduleState = await getContentPipelineScheduleState();

  return (
    <ContentAutomationDashboard
      initialScheduledPosts={scheduleState.scheduledPosts}
      initialAutomationRules={scheduleState.automationRules}
    />
  );
}
