import type { BriefingInput, PressReadyOutput } from "./schema";
import type { LibraryItem } from "./retrieval";

const intents: PressReadyOutput["likely_questions"][number]["intent"][] = [
  "Clarify","Verify","Challenge","Compare","Accountability","Human Impact"
];
const diffs: PressReadyOutput["likely_questions"][number]["difficulty"][] = ["Easy","Medium","Hard"];

function q(id: string, question: string, difficulty: any, intent: any, rationale: string) {
  return { id, question, difficulty, intent, rationale };
}

export function generateMock(brief: BriefingInput, anchors: LibraryItem[]): PressReadyOutput {
  const base = [
    `What problem does this announcement solve for customers in ${brief.country}?`,
    `Why launch this now — what changed in the market or inside ${brief.clientName}?`,
    `What proof points support your key claims, and what evidence is still missing?`,
    `How does this compare with competitors — and why is your approach meaningfully different?`,
    `What are the biggest risks or trade-offs you’re acknowledging upfront?`,
    `How will success be measured over the next 90 days and 12 months?`,
    `Who benefits most — and who might be negatively impacted?`,
    `What would you say to critics concerned about ${brief.sensitiveIssues}?`,
    `What details are off-limits today, and why?`,
    `What would make you change course if early outcomes don’t match expectations?`,
    `How does this align with your stated purpose beyond marketing language?`,
    `What’s the single message you want a skeptical journalist to quote accurately?`,
  ];

  const likely = base.map((text, i) =>
    q(`LQ-${i+1}`, text, diffs[i%3], intents[i%6], `Likely angle for ${brief.mediaOutlet}: clarity + proof + impact.`)
  );

  const tough = [
    `You say “${firstLine(brief.keyMessages)}”. What data supports that — and what would disprove it?`,
    `If someone calls this “spin”, what is your strongest verifiable rebuttal?`,
    `What is the hardest question you hope you won’t be asked — and answer it now.`,
    `If customers complain publicly within 48 hours, what responsibility do you take?`,
    `Give a number: what measurable commitment is attached — if none, why?`,
    `Name one trade-off you accept. If you can’t, it suggests you haven’t done the work.`,
    `What would regulators, advocates, or competitors criticize — and where might they be right?`,
    `Will you publish methodology or third-party validation? If not, why should people trust it?`,
  ].slice(0, 8).map((text, i) =>
    q(`TQ-${i+1}`, text, "Hard", i%2===0 ? "Challenge":"Accountability", "Designed to expose proof gaps and accountability.")
  );

  const followups = [
    {
      base_question_id: "LQ-3",
      followups: [
        { question: "What independent evidence backs that up (audits, benchmarks, partners)?", trap_type: "Proof Gap" as const, rationale: "Forces verification beyond internal claims." },
        { question: "If that evidence isn’t available, why should the public believe you?", trap_type: "Pressure" as const, rationale: "Tests credibility under uncertainty." },
      ]
    }
  ];

  const stress = [
    { test: "Proof test: Restate claims as verifiable facts.", what_it_probes: "Hype vs evidence.", how_a_journalist_might_frame_it: "“What can you prove today?”" },
    { test: "Consistency test: Compare with past statements that could conflict.", what_it_probes: "Contradictions.", how_a_journalist_might_frame_it: "“Last year X. Today Y. Which is true?”" },
    { test: "Numbers test: Force 1–2 concrete metrics tied to success.", what_it_probes: "Vagueness.", how_a_journalist_might_frame_it: "“Give me the numbers.”" },
    { test: "Accountability test: Map who owns outcomes if something goes wrong.", what_it_probes: "Responsibility.", how_a_journalist_might_frame_it: "“Who answers if this fails?”" },
    { test: "Stakeholder test: Identify who might be disadvantaged.", what_it_probes: "Human impact.", how_a_journalist_might_frame_it: "“Who loses in this story?”" },
    { test: "Crisis headline test: Draft the negative headline and prepare response.", what_it_probes: "Reputation risk.", how_a_journalist_might_frame_it: `“If headline is about ${brief.sensitiveIssues}, what do you say?”` },
  ];

  const talking = [
    { point: "Lead with the “why now” in one sentence, anchored to a real shift.", supports_message: "Sets context before details.", avoid: "Avoid vague ‘game-changing’ language without proof." },
    { point: "Offer 2–3 proof points (metrics, pilots, partners, validation).", supports_message: "Improves credibility.", avoid: "Avoid overclaiming impact you can’t verify." },
    { point: "Acknowledge sensitive issues proactively and explain guardrails.", supports_message: "Builds trust.", avoid: "Avoid dismissing concerns." },
    { point: "Keep answers quotable: problem → action → evidence → impact.", supports_message: "Journalist-friendly.", avoid: "Avoid long defensive backstory." },
    { point: `Tailor to ${brief.mediaOutlet}: what will their audience care about first?`, supports_message: "Relevance.", avoid: "Avoid repeating slogans." },
    { point: "Use comparison frame: what you do, what you don’t, and why.", supports_message: "Neutralizes traps.", avoid: "Avoid naming competitors casually." },
    { point: "Prepare a ‘hard stop’ line for off-limits details (legal/privacy).", supports_message: "Protects the client.", avoid: "Avoid ‘no comment’ without a reason." },
    { point: "Close with human impact: what changes for real people.", supports_message: "Narrative weight.", avoid: "Avoid corporate abstractions." },
  ];

  const themes = [
    { theme: "Clarity & Strategy", questions: ["LQ-1","LQ-2","LQ-12"] },
    { theme: "Proof & Credibility", questions: ["LQ-3","LQ-6","TQ-1","TQ-8"] },
    { theme: "Risk & Accountability", questions: ["LQ-5","LQ-8","TQ-4","TQ-7"] },
    { theme: "Competition & Market", questions: ["LQ-4","LQ-10","TQ-6"] },
    { theme: "Human Impact", questions: ["LQ-7","LQ-11","TQ-2"] },
  ];

  const anchors_used = anchors.slice(0, 24).map(a => ({
    id: a.id,
    category: a.category || "",
    scenario: a.scenario || "",
    tone: a.tone || "",
    question: a.question
  }));

  return {
    likely_questions: likely,
    tough_questions: tough,
    followups_and_traps: followups,
    narrative_stress_tests: stress,
    suggested_talking_points: talking,
    theme_buckets: themes,
    anchors_used
  };
}

function firstLine(s: string) {
  const line = s.split(/\n|\.|;/).map(x=>x.trim()).filter(Boolean)[0];
  return (line || "our key message").slice(0, 80);
}
