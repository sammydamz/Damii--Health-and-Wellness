import { z } from 'genkit';

const PlanStep = z.object({
  id: z.string().describe('Unique identifier for this step (e.g., "1", "2", "step-hydration-1")'),
  text: z.string().describe('The actionable step text, maximum 120 characters. Be specific and micro-action focused. Example: "Drink a glass of water when you wake up"'),
  category: z.enum(['movement','sleep','hydration','nutrition','social','breathing','cognitive','other']).describe('Category of wellness activity: movement (walks, stretching, exercise), sleep (bedtime routines, sleep hygiene), hydration (water intake), nutrition (meal planning, healthy eating), social (connecting with others), breathing (breathing exercises, meditation), cognitive (journaling, gratitude), other (miscellaneous)'),
  durationMinutes: z.coerce.number().int().nonnegative().optional().describe('Optional: How many minutes this activity takes (e.g., 5, 10, 30). Use z.coerce to handle string-to-number conversion.'),
  frequency: z.string().optional().describe('Optional: How often to do this (e.g., "daily", "3x per week", "as needed", "before bed")'),
  priority: z.enum(['low','medium','high']).optional().describe('Optional: Priority level - high for critical/foundational actions, medium for important but flexible, low for nice-to-have'),
  when: z.string().optional().describe('Optional: When to do this action (e.g., "morning", "evening", "after meals", "during work breaks", "before bed")'),
  safety: z.string().nullable().optional().describe('Optional: Any safety considerations or modifications for this step (e.g., "Stop if you feel dizzy", "Consult doctor if pain persists")'),
  followUpQuestion: z.string().nullable().optional().describe('Optional: A reflective question to help the user track progress or deepen awareness (e.g., "How did this make you feel?", "What barriers came up?")')
});

export const WellnessPlanSchema = z.object({
  emotionalSupport: z.string().describe('2-4 sentences of empathetic, validating support that directly acknowledges the user\'s specific situation and emotional state. Reference their concerns explicitly. Example: "It sounds like work pressure is taking a real toll on your sleep and energy. That cycle is tough, but small changes can help break it."'),
  wellnessTips: z.string().describe('2-4 sentences of evidence-based wellness advice tailored to their concerns. Include specific, actionable suggestions on hydration, sleep hygiene, movement, or nutrition. Example: "Prioritize a wind-down routine 1 hour before bed—no screens, try deep breathing or reading. Stay hydrated and consider a 15-minute walk at lunch to regulate stress hormones."'),
  personalizedPlan: z.object({
    id: z.string().describe('Unique plan identifier. Generate using a descriptive slug and timestamp (e.g., "plan-stress-sleep-1234567890" or "plan-energy-nutrition-001")'),
    title: z.string().describe('Clear, motivating title that reflects the user\'s specific concern (4-8 words). Example: "Stress Relief & Sleep Reset Plan" or "Energy Boost Through Simple Nutrition"'),
    overview: z.string().describe('1-2 sentence overview explaining what this plan will help achieve and the general approach. Make it specific to their input. Example: "A 2-week plan to reduce work-related stress and improve sleep quality through relaxation techniques and sleep hygiene adjustments."'),
    summaryBullets: z.array(z.string()).min(3).max(6).describe('3-6 bullet points highlighting the key actions or themes of this plan. Each bullet should be 8-15 words, actionable, and specific. Example bullets: "Establish a consistent bedtime routine to signal your body it\'s time to rest", "Practice 5-minute breathing exercises when work stress peaks"'),
    steps: z.array(PlanStep).min(3).max(8).describe('3-8 actionable steps ordered by priority or typical daily sequence. Each step should be a micro-action (doable in 5-30 mins) and clearly tied to one of the 8 wellness categories. Prioritize steps that directly address the user\'s stated concerns.'),
    estimatedEffort: z.enum(['low','medium','high']).describe('Overall effort level required for this plan. Low: minimal time/energy (5-15 mins/day), mostly habit-based. Medium: moderate commitment (20-40 mins/day), some planning needed. High: significant time/focus (1+ hour/day), lifestyle changes required. Match this to the user\'s apparent capacity from their input.'),
    timeframe: z.string().describe('Realistic timeframe to see results or complete the plan. Use human-readable formats like "3-5 days", "1 week", "2 weeks", "3-4 weeks". Match the timeframe to effort level and user\'s urgency.')
  }),
  safetyFlag: z.boolean().optional().describe('Optional: Set to true if the user\'s input contains concerning language about self-harm, suicide, severe depression, or crisis. This triggers additional safety messaging.'),
  safetyMessage: z.string().nullable().optional().describe('Optional: If safetyFlag is true, provide crisis resources here (e.g., "If you are in immediate danger, please call 988 (National Suicide Prevention Lifeline) or 911"). Otherwise, set to null.')
});

export type WellnessPlanOutput = z.infer<typeof WellnessPlanSchema>;
export type PlanStep = z.infer<typeof PlanStep>;
