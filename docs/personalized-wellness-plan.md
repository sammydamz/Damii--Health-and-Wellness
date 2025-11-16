# Personalized Wellness Plan — Design & Implementation

Date: 2025-11-16

This document describes how DAMII will generate, present, and optionally store personalized wellness plans derived from the user's free-text Wellness Check-in.

---

## 1. Purpose
- Convert a free-text check-in into a structured, actionable, and safe personalized plan.
- Provide short-term micro-actions and longer-term guidance while ensuring privacy, non-diagnostic behavior, and safety.
- Allow the user to save and track their plan with explicit consent.

## 2. High-level flow
1. User submits free-text check-in via `WellnessForm`.
2. Client calls server action (e.g., `analyzeWellnessInputAndGeneratePlan`) with sanitized input and optional user context/consent flags.
3. Server builds a structured prompt and calls the LLM with a strict output schema (Zod) to receive a validated plan object.
4. Server runs safety checks (red flags); if flagged, return crisis guidance instead of a plan.
5. On success, return the structured plan to the client UI.
6. If the user gives consent, persist the plan to Firestore at `/users/{userId}/plans/{planId}`.
7. UI renders the plan, lets user mark steps complete, ask follow-ups, or save/delete the plan.

## 3. Output schema (Zod) — `WellnessPlanSchema`
- This schema is enforced server-side. Use Zod to validate LLM output.

```ts
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
    id: z.string(), // uuid or timestamp-based
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
```

## 4. Prompt Template & Strategy
- Use a strong system prompt to instruct: empathetic tone, non-diagnostic, structured JSON-only output matching schema, safety-first instructions.
- Include optional user context (preferences, availability) only when user consented; otherwise only use the free-text input.
- Ask the model to keep each step short (<= 120 characters) and prioritize low-friction micro-actions.

Example prompt excerpt:
```
System: You are DAMII, a non-diagnostic wellness assistant. Produce JSON exactly matching the provided schema. If the user describes self-harm or imminent danger, set safetyFlag true and return safetyMessage with crisis resources.

User Input: "<user input goes here>"

Context: {"preferredTime": "morning", "mobilityLimitations": "none"} // only if consented

Output: JSON matching WellnessPlanSchema
```

## 5. Server Action: `analyzeWellnessInputAndGeneratePlan`
- Location: `src/app/actions.ts` (or a new server action file)
- Steps:
  1. Sanitize input: remove direct PII (emails, phone numbers) or prompt user to confirm if PII present.
  2. Optional quick regex-based safety classifier for red flags (self-harm). If flagged, return emergency guidance immediately.
  3. Build prompt and call `ai.generate({ model, prompt, output: { schema: WellnessPlanSchema } })`.
  4. Validate the returned JSON with Zod. If invalid, attempt a single correction pass with the model or fall back to a plain-text safe summary.
  5. Return the validated object to client. If user asked to save, call `saveWellnessPlan(firestore, userId, plan)`.

## 6. Firestore storage model
Collection: `/users/{userId}/plans/{planId}`
Document fields:
- `id`: string (planId)
- `title`, `overview`, `summaryBullets`, `steps` (array as in schema)
- `createdAt`, `updatedAt` (ISO string or Timestamp)
- `modelVersion` (string) — which LLM/model and prompt revision
- `consent` (boolean) — user explicitly consented to saving
- `source` (string) — 'web' | 'mobile'

Save helper (example):
```ts
export async function saveWellnessPlan(firestore: Firestore, userId: string, plan: WellnessPlanOutput) {
  const docRef = doc(firestore, `users/${userId}/plans/${plan.personalizedPlan.id}`);
  return setDoc(docRef, { ...plan, createdAt: new Date().toISOString() }, { merge: true });
}
```

## 7. Consent & Privacy
- Before saving, present a short consent dialog: "Save this plan to your private account? Plans remain private and can be deleted anytime." Offer Yes/No.
- If user declines, do not store the raw input or any PII; optionally store anonymized metadata (e.g., plan created boolean) only if user consents to analytics.
- Avoid storing raw free-text check-ins unless required and explicitly consented.

## 8. Safety & Red Flags
- Use a two-tier approach:
  1. Quick client/server regex keyword check for obvious red-flag words (suicide, harm, overdosing, etc.). If matched, return immediate crisis UI and skip plan generation.
  2. LLM should also populate `safetyFlag` if it detects elevated risk.
- Crisis response should include localized resources (hotlines) when possible and an urgent instruction to seek immediate help.

## 9. UI / UX
- `WellnessForm` result area should show: Emotional Support (top), Summary Bullets, Personalized Plan (collapsible), Wellness Tips.
- `Personalized Plan` view:
  - Show `summaryBullets` (3–6 bullets)
  - Render `steps` as a checklist; allow marking as complete (persist local progress, optionally sync)
  - Per-step: show `durationMinutes`, `frequency`, `priority`, and `safety` if present
  - Small control to `Save Plan` (opens consent modal)
  - Follow-up button for clarifying questions (sends follow-up to the server action with conversation history)
- Accessibility: ensure keyboard navigation, aria-live announcements for saved/failed states, readable contrast, and responsive layout.

## 10. Tracking & Metrics
- Events to emit:
  - `plan_generated` (include `userId` if logged in, `safetyFlag`, `estimatedEffort`)
  - `plan_saved`
  - `plan_step_completed`
- Monitor failure rates and validation/parsing errors from the LLM.

## 11. Tests & QA
- Unit tests:
  - Schema validation tests for `WellnessPlanSchema` with valid/invalid examples.
  - `analyzeWellnessInputAndGeneratePlan` mock tests (mock ai.generate to return valid and invalid payloads).
- Integration/E2E:
  - Submit a check-in, assert plan rendering and Save flow works with consent toggled.
  - Simulate red-flag input and assert crisis UI shown.

## 12. Implementation tasks (concrete)
- [ ] Create `src/app/schemas/wellness-plan.ts` with Zod schema.
- [ ] Implement `analyzeWellnessInputAndGeneratePlan` server action (calls `ai.generate` with schema output).
- [ ] Add `saveWellnessPlan` to `src/firebase/user-actions.ts`.
- [ ] Add consent modal and `WellnessPlanView` UI component.
- [ ] Add safety regex classifier and local fallback.
- [ ] Add tests and an E2E scenario for plan generation + save + red-flag.

## 13. Example server action (high-level)
```ts
export async function analyzeWellnessInputAndGeneratePlan(userInput: string, opts?: { userId?: string, save?: boolean }) {
  // 1. sanitize input
  // 2. quick safety check (regex)
  // 3. call ai.generate with WellnessPlanSchema
  // 4. validate with Zod
  // 5. if opts.save and userId -> saveWellnessPlan(...)
  // 6. return validated plan
}
```

## 14. Next steps I can implement for you
- Create `WellnessPlanSchema` and server action, plus `saveWellnessPlan` helper.
- Add the UI `WellnessPlanView` and consent modal.
- Add basic safety regex and tests.

---

If you'd like, I can start by implementing the `WellnessPlanSchema` and the server action (and run a local test using the `ai.generate` mock). Which part should I start with?

## 15. Genkit integration (recommended for this repo)

We will keep using the existing `genkit` wrapper in `src/ai/genkit.ts` and call Gemini `gemini-2.5-flash` via the `@genkit-ai/google-genai` plugin. Below are concrete integration notes, server-action examples, parsing & retry guidance, and credential best practices.

### Why use Genkit here
- It is already wired into this repo (`src/ai/genkit.ts`) so integration is fast.
- Genkit supports calling Google GenAI models and the current code already uses `ai.generate(...)` patterns — minimal refactor required.
- It keeps the app provider-agnostic and simple to mock in tests (we already have `analyzeWellnessInputAndProvideSupport` using `ai`).

### Model choice
- Use `gemini-2.5-flash` as requested. When calling `ai.generate`, pass `model: 'gemini-2.5-flash'` in the options.

### Server action example (using genkit + Zod schema)
Place this server-side in `src/app/actions.ts` (or a new server action file). It shows sanitization, safety check, calling genkit, parsing and Zod validation, and an optional retry for parsing failures.

```ts
import { z } from 'genkit';
import { ai } from '@/ai/genkit';
import { WellnessPlanSchema, type WellnessPlanOutput } from '@/app/schemas/wellness-plan';

export async function analyzeWellnessInputAndGeneratePlan(userInput: string) : Promise<WellnessPlanOutput> {
  // 1) Quick sanitize / PII removal (simple example)
  const sanitized = userInput.replace(/\b\S+@\S+\.\S+\b/g, '[email]');

  // 2) Quick safety regex check (example)
  const safetyRegex = /\b(suicid|kill myself|hurt myself|end my life)\b/i;
  if (safetyRegex.test(sanitized)) {
    return {
      emotionalSupport: 'I’m sorry you’re feeling this way. If you are in immediate danger please contact local emergency services or a crisis hotline.',
      wellnessTips: '',
      personalizedPlan: {
        id: 'safety-redirect',
        title: 'Immediate support',
        overview: 'Crisis guidance delivered instead of a plan.',
        summaryBullets: [],
        steps: [],
        estimatedEffort: 'low',
        timeframe: 'immediate'
      },
      safetyFlag: true,
      safetyMessage: 'Detected language that may indicate imminent risk. Show crisis resources.'
    } as WellnessPlanOutput;
  }

  // 3) Build a clear prompt that requests JSON-only output matching the schema
  const prompt = `You are DAMII. Produce JSON only that matches the WellnessPlanSchema. User input: "${sanitized}"`;

  // 4) Call genkit AI
  const { output } = await ai.generate({
    model: 'gemini-2.5-flash',
    prompt,
    // genkit supports returning structured output via a Zod schema if provided
    output: { schema: WellnessPlanSchema }
  }).catch(err => {
    console.error('AI call failed', err);
    throw err;
  });

  // 5) Validate and return (genkit should already coerce to schema when possible)
  try {
    // If `output` is already validated, return it directly
    return output as WellnessPlanOutput;
  } catch (e) {
    // As a defensive fallback, attempt a single retry asking for JSON only
    const retryPrompt = prompt + '\nIf your previous output was not valid JSON, re-output only the JSON exactly matching the schema.';
    const { text } = await ai.generate({ model: 'gemini-2.5-flash', prompt: retryPrompt });
    try {
      const parsed = JSON.parse(text || '{}');
      return WellnessPlanSchema.parse(parsed);
    } catch (err) {
      console.error('Failed to parse AI response on retry', err);
      throw new Error('Unable to parse AI response');
    }
  }
}
```

### Parsing, retries & validation notes
- Although genkit can accept a Zod schema in `output.schema`, always validate server-side with `WellnessPlanSchema.parse(...)` as a defense-in-depth.
- If the model returns malformed JSON, do a single retry asking the model to respond with JSON-only. If parsing fails again, return a graceful error to the client and log the failure for manual review.

### API keys / credentials — do we bring our API key?
- Short answer: Yes — you must provide credentials for the Google GenAI usage, but do NOT embed them in client bundles.

Recommended approaches (choose one):

- Server environment with Application Default Credentials (recommended for server deployments on GCP):
  - Create a Google Cloud service account with the minimum required roles for GenAI access.
  - Download the service account JSON and set `GOOGLE_APPLICATION_CREDENTIALS` in your server environment (or configure the runtime to use Workload Identity / default service account).

- Server environment variable with a restricted API key (if supported by your GenAI setup):
  - Store the API key in environment variables (e.g., `GENKIT_GOOGLE_API_KEY`) or a secret manager and load it on the server.

- Secret Manager (recommended for production):
  - Store the service account or API key in Google Secret Manager (or your cloud provider's secret store) and fetch it at runtime in a secure, audited manner.

Do NOT:
- Do not commit any API keys or service account files to the repo.
- Do not expose credentials to the browser or client-side code.

### Billing & quotas
- GenAI calls are billable — enable billing on the Google Cloud project and configure quotas/alerts.
- Prefer server-side rate-limiting and monitoring to avoid runaway costs.

### Logging & observability
- Log model parse failures and Zod validation errors to your monitoring/alerting system.
- Emit events (`plan_generated`, `plan_validation_failed`) with minimal metadata (avoid storing raw user input unless consented).

### Next steps I can implement for you
- Add `src/app/schemas/wellness-plan.ts` (Zod schema) and wire it into `analyzeWellnessInputAndGeneratePlan` using the genkit integration shown above.
- Add `saveWellnessPlan` helper in `src/firebase/user-actions.ts` and a simple consent modal in the `WellnessForm` UI.

If you want me to start, say “Go ahead — use genkit” and I’ll implement the schema + server action and run a quick local test.