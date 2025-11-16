import { z } from 'genkit';

const PlanStep = z.object({
  id: z.string(),
  text: z.string(),
  category: z.enum(['movement','sleep','hydration','nutrition','social','breathing','cognitive','other']),
  durationMinutes: z.number().int().nonnegative().optional(),
  frequency: z.string().optional(),
  priority: z.enum(['low','medium','high']).optional(),
  when: z.string().optional(),
  safety: z.string().nullable().optional(),
  followUpQuestion: z.string().nullable().optional()
});

export const WellnessPlanSchema = z.object({
  emotionalSupport: z.string(),
  wellnessTips: z.string(),
  personalizedPlan: z.object({
    id: z.string(),
    title: z.string(),
    overview: z.string(),
    summaryBullets: z.array(z.string()).max(6),
    steps: z.array(PlanStep).min(1),
    estimatedEffort: z.enum(['low','medium','high']),
    timeframe: z.string()
  }),
  safetyFlag: z.boolean().optional(),
  safetyMessage: z.string().nullable().optional()
});

export type WellnessPlanOutput = z.infer<typeof WellnessPlanSchema>;
export type PlanStep = z.infer<typeof PlanStep>;
