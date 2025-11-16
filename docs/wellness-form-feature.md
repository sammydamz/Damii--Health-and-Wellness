# Wellness Form Feature — Design & Implementation Spec

Date: 2025-11-16

Purpose
- Capture the product and engineering decisions for the Wellness Check-in form and the Activity Logger feature.
- Provide concrete implementation steps, data model, security rules, UX/validation, offline behavior, testing and rollout plan.

## 1) Current state (what's already in the repo)
- Frontend components:
  - `src/components/wellness-form.tsx` — a client component that collects a free-text wellness check-in, validates with `zod`, calls `analyzeWellnessInputAndProvideSupport` action and shows AI-generated support + tips.
  - `src/components/dashboard/activity-logger.tsx` — a rich UI for daily mood + activities (predefined + custom), date picker, slider for mood, and a `Save Log` button.
- Firestore helpers:
  - `src/firebase/user-actions.ts` — contains `saveMoodLog()` and `getMoodLogs()` functions. Current save logic checks for an existing document for the date and `updateDoc` if found, otherwise `addDoc`.
- Firestore security rules:
  - `firestore.rules` uses `isOwner(userId)` and allows read/write for subcollections `/users/{userId}/moodLogs` and `/users/{userId}/chatHistory` when `request.auth.uid == userId`.

## 2) Goals & constraints
- Keep all user wellness data private to the user.
- Provide a snappy UX with optimistic updates where possible.
- Prevent duplicate entries for the same date; prefer update-over-create behavior.
- Support offline writes (desktop & mobile) and reliable sync when online.
- Validate inputs on client (for UX) and follow defensible server-side validation patterns.
- Ensure accessibility and test coverage (unit + E2E).

## 3) Data model
Collection path: `/users/{userId}/moodLogs/{logId}`
Each document:
- `date` (string): `YYYY-MM-DD` — primary logical key (indexed)
- `mood` (number): 1..5
- `activities` (string[]): activity IDs for predefined (e.g. "hydration") or free-text strings for custom activities
- `notes?` (string) optional user notes
- `createdAt` (Timestamp|string) — when record created
- `updatedAt` (Timestamp|string) — last update time
- `timestamp` (Firestore Timestamp) — for ordering or queries
- (optional) `source` (string) — 'web'|'mobile' to track origin

Indexing:
- Create composite index (if needed) on `date` or ensure single-field index for `date` for efficient lookups.

Rationale: `date` is the logical unique key. `saveMoodLog` should query by `date` and update existing entry if present (already implemented).

## 4) Security rules (recommendation)
Current rules are appropriate; include the snippet in rules file (already present). Example snippet:

```js
function isOwner(userId) {
  return request.auth != null && request.auth.uid == userId;
}

match /users/{userId}/moodLogs/{logId} {
  allow read: if isOwner(userId);
  allow create: if isOwner(userId) && request.resource.data.date is string;
  allow update: if isOwner(userId);
  allow delete: if isOwner(userId);
}
```

Notes:
- Keep checks minimal but assert required types for created docs (e.g., `request.resource.data.date is string`, `request.resource.data.mood is int` if you want stronger validation in rules).
- Avoid overly brittle assertions (e.g., exact id matches) that break ordinary client writes.

## 5) Frontend validation & UX
- Validation library: Zod + react-hook-form (already in use in `WellnessForm` component). Reuse the same pattern for activity-logger when saving (small schema on the client side before calling save).

Example Zod schema for mood log:

```ts
const moodLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: z.number().int().min(1).max(5),
  activities: z.array(z.string()).max(50),
  notes: z.string().optional(),
});
```

- UX: Disable `Save` until validation passes (activity-logger already disables while saving). Provide clear toasts for success and failure (done).
- Optimistic update: Update UI list immediately after a successful request; keep ability to rollback if server write fails — the current code updates local logs after save, which is correct; we can make it optimistic by updating locally before the save and showing 'Saving...' state.

## 6) Offline & sync behavior
- Enable Firestore offline persistence in your Firebase client initialization (call `enableIndexedDbPersistence(firestore)` on app startup). This will allow writes while offline that sync when online.

Example (in your `src/firebase/index` or provider):

```ts
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(firestore).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab.
  } else if (err.code === 'unimplemented') {
    // The browser does not support all features required to enable persistence
  }
});
```

- Conflict resolution: Because `saveMoodLog` queries by `date` and updates the first matching doc, offline writes that resolve to the same query when syncing may create duplicates in rare edge cases. To mitigate:
  - Use a deterministic doc ID pattern if you want strict uniqueness: use `doc(firestore, users/${uid}/moodLogs/${date})` (date-based id) instead of `addDoc`. That guarantees a single doc per date and makes offline merges deterministic.
  - If using `addDoc` + query/update, keep the existing logic but consider switching to date-based doc ID to reduce risk.

Recommendation: use date-based document IDs for uniqueness (unless you need to allow multiple entries per date). Example: `doc(firestore, users/${uid}/moodLogs/${date})`.

## 7) Backend (server-side) considerations
- Currently `saveMoodLog` is client-side. That is fine, but consider providing a server-side API (Next.js server action or edge function) if you need stronger validation, audit logs, or to integrate business logic before write. Example: an app action `app/actions.saveMoodLog` that validates payload server-side then writes to Firestore using an admin SDK.
- If you keep writes in client code, ensure robust error handling and monitoring (Sentry/console + toasts already used).

## 8) Data privacy & AI features
- For the `WellnessForm` that calls AI analysis (`analyzeWellnessInputAndProvideSupport`), ensure PII/sensitive data handling:
  - Don't store the raw free-text in Firestore unless explicitly required and consented.
  - If analysis is done server-side, strip out direct PII and refrain from logging full messages.
  - Follow applicable laws and regulations for medical/mental health content.

## 9) Tests & QA
- Unit tests (recommended files):
  - `src/firebase/user-actions.test.ts` — test saveMoodLog behavior: create new, update existing, error handling.
  - `src/components/dashboard/activity-logger.test.tsx` — test UI interactions: select activities, add custom, save triggers save call, local update.
- E2E tests (Cypress / Playwright):
  - Signup -> Dashboard -> Fill activity -> Save -> Verify toast
  - Offline write test: simulate offline -> save -> go online -> verify Firestore has doc

## 10) Accessibility
- Ensure form fields have labels (already done for activity logger via `Label` components).
- Ensure keyboard operability for slider and calendar (slider uses keyboard and calendar uses popover with focus management).
- Announce success/failure via ARIA live regions or ensure toasts are accessible.

## 11) Analytics & monitoring
- Track events: `wellness_log_saved`, `wellness_log_failed`, include `userId`, `date`, `mood` (avoid storing raw personal notes in analytics unless consented).
- Track key metrics: save success rate, offline save frequency, number of custom activities created.

## 12) Implementation tasks (file-level)
1. (Optional but recommended) Switch to date-based doc IDs for moodLogs to guarantee single entry per date:
   - Update `saveMoodLog` in `src/firebase/user-actions.ts` to use `const docRef = doc(firestore, `users/${userId}/moodLogs/${moodData.date}`)` and `setDoc(docRef, { ... }, { merge: true })`.
   - Pros: deterministic, fewer duplicates. Cons: date-only id means you must ensure date format stable and unique.

2. Add Zod schema validation on the client before calling `saveMoodLog` (either inline or as a shared util):
   - File: `src/lib/schemas/mood.ts` -> export `moodLogSchema` and reuse in components and server actions.

3. Enable offline persistence in your firebase provider/init file:
   - File: `src/firebase/index.ts` or `src/firebase/provider.tsx`
   - Code: `enableIndexedDbPersistence(firestore)` with graceful fallback.

4. Improve `firestore.rules` with optional type checks on create (already acceptable). Keep `isOwner` guard.

5. Add tests:
   - Unit tests for `saveMoodLog`.
   - E2E test that signs up a test user and saves a log (we already used Chrome automation for manual test flow).

6. (Optional) Add a server action or API route for server-side validation or to perform aggregated writes.

## 13) Implementation examples
- Date-based ID `saveMoodLog` (example change):

```ts
export async function saveMoodLog(firestore: Firestore, userId: string, moodData: { date: string; mood: number; activities: string[]; notes?: string }) {
  const docRef = doc(firestore, `users/${userId}/moodLogs/${moodData.date}`);
  const payload = {
    ...moodData,
    updatedAt: new Date().toISOString(),
    timestamp: Timestamp.now(),
  };
  return setDoc(docRef, payload, { merge: true });
}
```

- Client Zod schema usage (example):

```ts
import { moodLogSchema } from '@/lib/schemas/mood';

const parsed = moodLogSchema.safeParse({ date, mood, activities, notes });
if (!parsed.success) {
  toast({ variant: 'destructive', title: 'Validation error', description: parsed.error.message });
  return;
}
await saveMoodLog(firestore, user.uid, parsed.data);
```

## 14) Rollout checklist
- [ ] Update `saveMoodLog` implementation (optional: change to date-based doc ID) and run unit tests
- [ ] Enable persistence and smoke test offline writes
- [ ] Add server validation or API route if required for compliance
- [ ] Add/Update Firestore indexes if necessary
- [ ] Add tests (unit + E2E)
- [ ] Deploy and monitor logs for permission errors or write failures

## 15) Recommended next steps for the team (short)
- Decide: keep `addDoc` + query/update or switch to date-based doc IDs. I recommend date-based IDs for uniqueness.
- Add a shared `moodLogSchema` file and wire client components to it.
- Enable offline persistence in the firebase provider and test sync.
- Add unit tests for `saveMoodLog` and an E2E test for the full signup->save flow.

---

If you want, I can:
- Implement the `date-based doc ID` change in `saveMoodLog` and update references.
- Add `src/lib/schemas/mood.ts` and update `activity-logger.tsx` to use the schema and perform pre-save validation.
- Add a minimal unit test for `saveMoodLog`.

Tell me which follow-up step you'd like me to do next and I'll start that work.
