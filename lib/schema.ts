import { z } from "zod";

export const CountrySchema = z.enum([
  "Thailand",
  "Singapore",
  "Vietnam",
  "Indonesia",
  "Philippines",
]);

export const BriefingSchema = z.object({
  clientName: z.string().min(1),
  industry: z.string().min(1),
  country: CountrySchema,
  announcementTopic: z.string().min(1),
  keyMessages: z.string().min(1),
  mediaOutlet: z.string().min(1),
  journalistName: z.string().optional().nullable(),
  sensitiveIssues: z.string().min(1),
  interviewFormat: z.string().min(1),
});

export type BriefingInput = z.infer<typeof BriefingSchema>;

export const QuestionIntentSchema = z.enum([
  "Clarify",
  "Verify",
  "Challenge",
  "Compare",
  "Accountability",
  "Human Impact",
]);

export const DifficultySchema = z.enum(["Easy", "Medium", "Hard"]);

export const QuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  difficulty: DifficultySchema,
  intent: QuestionIntentSchema,
  rationale: z.string(),
});

export const FollowupSchema = z.object({
  base_question_id: z.string(),
  followups: z.array(
    z.object({
      question: z.string(),
      trap_type: z.enum([
        "Pressure",
        "Contradiction",
        "Proof Gap",
        "Numbers",
        "Responsibility",
        "Ethics/Impact",
      ]),
      rationale: z.string(),
    })
  ),
});

export const ThemeBucketSchema = z.object({
  theme: z.string(),
  questions: z.array(z.string()),
});

export const PressReadyOutputSchema = z.object({
  likely_questions: z.array(QuestionSchema).length(12),
  tough_questions: z.array(QuestionSchema).min(6).max(10),
  followups_and_traps: z.array(FollowupSchema),
  narrative_stress_tests: z
    .array(
      z.object({
        test: z.string(),
        what_it_probes: z.string(),
        how_a_journalist_might_frame_it: z.string(),
      })
    )
    .min(6)
    .max(12),
  suggested_talking_points: z
    .array(
      z.object({
        point: z.string(),
        supports_message: z.string(),
        avoid: z.string(),
      })
    )
    .min(8)
    .max(16),
  theme_buckets: z.array(ThemeBucketSchema).min(4).max(10),
  anchors_used: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      scenario: z.string(),
      tone: z.string(),
      question: z.string(),
    })
  ).min(6).max(30),
});

export type PressReadyOutput = z.infer<typeof PressReadyOutputSchema>;
