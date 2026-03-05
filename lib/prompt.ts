import type { BriefingInput } from "./schema";
import type { LibraryItem } from "./retrieval";

export function buildInstructions() {
  return [
    "You are PressReady, an AI-powered media interview preparation assistant for PR consultants.",
    "Simulate how journalists actually frame, pressure, and follow up in interviews.",
    "Use the reference library examples to match phrasing and angles.",
    "Do NOT copy reference questions verbatim. Generate new questions specific to this briefing.",
    "Avoid inventing facts. If information is missing, create questions that expose the gap.",
    "Return ONLY valid JSON matching the schema. No markdown. No extra text."
  ].join("\n");
}

export function buildUserInput(brief: BriefingInput, anchors: LibraryItem[]) {
  return JSON.stringify({
    briefing: {
      client_name: brief.clientName,
      industry: brief.industry,
      country: brief.country,
      announcement_topic: brief.announcementTopic,
      key_messages: brief.keyMessages,
      media_outlet: brief.mediaOutlet,
      journalist_name: brief.journalistName ?? "",
      sensitive_issues: brief.sensitiveIssues,
      interview_format: brief.interviewFormat,
    },
    reference_library_examples: anchors.map(a => ({
      id: a.id,
      category: a.category || "",
      scenario: a.scenario || "",
      tone: a.tone || "",
      question: a.question
    })),
    constraints: {
      likely_questions: "Exactly 12 items, most likely first.",
      tough_questions: "6–10 items. Truly hard; tied to sensitive issues.",
      followups_and_traps: "Attach follow-ups to base_question_id. Use realistic trap types.",
      narrative_stress_tests: "6–12 tests probing proof, contradictions, accountability, impact.",
      suggested_talking_points: "8–16 concise points. Each includes what to avoid saying.",
      theme_buckets: "4–10 themes mapping question IDs.",
      tagging: "Every question includes difficulty + intent.",
      anchors_used: "Return anchors_used list (same items as reference examples)."
    }
  }, null, 2);
}
