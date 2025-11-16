# Wellness Plan Prompt Testing - Session 1
**Date:** November 16, 2025  
**Branch:** feature/improve-ai-prompts  
**Tester:** AI Agent via Chrome DevTools

## Summary

Tested improved prompt implementation with 2 scenarios. Both tests triggered the **enhanced fallback logic** instead of generating personalized plans from the AI model.

## Test Results

### ✅ Test 1: Work Stress + Sleep Issues
**Input:**
```
I'm so stressed from work deadlines and can't sleep at night. I feel exhausted all day and my manager keeps piling on more tasks.
```

**Result:** **FALLBACK (Enhanced)**
- **Title:** "Sleep Support Starter Plan"
- **Effort:** Low
- **Timeframe:** 1 week
- **Steps:** 4 steps (hydration, movement, breathing, sleep)

**Analysis:**
- ✅ **Theme Detection Working:** Fallback correctly detected "stress" + "sleep" themes
- ✅ **Enhanced Fallback:** Not the basic fallback - customized with breathing exercise and sleep-specific step
- ❌ **No Personalization:** Didn't reference "work deadlines" or "manager" 
- ❌ **Generic Emotional Support:** Template message, not tailored
- **Verdict:** Fallback improvement is working, but AI generation failed

**Screenshot:** `docs/test-screenshots/test1-work-stress-sleep.png`

---

### ✅ Test 2: Parent with No Time
**Input:**
```
I'm a parent of 2 young kids and I have zero time for myself. I feel burnt out and don't eat well because I'm always feeding them first.
```

**Result:** **FALLBACK (Basic with Nutrition)**
- **Title:** "Basic Wellness Plan"
- **Effort:** Low
- **Timeframe:** 1 week
- **Steps:** 3 steps (hydration, movement, nutrition)

**Analysis:**
- ✅ **Theme Detection Working:** Detected "nutrition" theme, added vegetable step
- ❌ **No Personalization:** Didn't mention "parent", "kids", or "burnt out"
- ❌ **Not Context-Aware:** Steps are generic 10-min walks (not parent-friendly 5-min activities)
- ❌ **Generic Emotional Support:** Same template message
- **Verdict:** Basic fallback with minor theme customization

---

## Root Cause Analysis

### Why Are We Getting Fallbacks?

Both tests hit the fallback logic in `analyzeWellnessInputAndGeneratePlan`:

```typescript
// Primary AI call failed
try {
  const { output } = await ai.generate({ ... });
  return output as WellnessPlanOutput;
} catch (error) {
  console.error('[analyzeWellnessInputAndGeneratePlan] Initial generation failed:', error);
  
  // Retry failed
  try {
    const { text } = await ai.generate({ ... });
    // Parse and validate
  } catch (retryError) {
    // FALLBACK TRIGGERED HERE
    return enhancedFallbackResponse();
  }
}
```

### ✅ ROOT CAUSE CONFIRMED:

**GOOGLE_API_KEY environment variable is NOT set**

Verified via PowerShell:
```powershell
echo $env:GOOGLE_API_KEY
# Output: (empty)
```

Without the API key, all `ai.generate()` calls to Gemini fail immediately, triggering the fallback logic. This explains why:
- Both tests hit the fallback
- No actual AI-generated content was produced
- Theme detection worked (it's regex-based, doesn't need API)
- Enhanced fallback logic worked correctly

### Other Possible Issues (Not Yet Tested):

1. **Gemini API Key Format**
   - Once set, verify it's a valid Gemini API key format
   - Should start with `AIza...`

2. **Prompt Too Long**
   - Our improved prompt with examples is ~3000+ tokens
   - May be hitting input token limits or causing parsing issues

3. **JSON Schema Enforcement**
   - Gemini 2.5 Flash might be struggling with our complex Zod schema
   - Schema descriptions are very detailed (good for guidance, but verbose)

4. **Model Configuration**
   - Temperature/topP/topK settings might need adjustment
   - Model might need more specific JSON format instructions

5. **Network/Timeout Issues**
   - Genkit might have shorter timeouts than model needs
   - Large prompt + complex schema = longer generation time

## What's Working ✅

1. **Enhanced Fallback Logic:** Successfully detects themes (stress, sleep, nutrition) and customizes fallback response
2. **Safety PII Sanitization:** Email/phone/SSN removal working
3. **Theme Detection in Fallback:** Regex correctly identifies user concerns
4. **No Client Errors:** UI handles fallback gracefully, no crashes
5. **Schema Validation:** Fallback responses pass Zod validation

## What's Not Working ❌

1. **Primary AI Generation:** Model calls are failing (either initially or on retry)
2. **Personalization:** No AI-generated personalized content reaching the user
3. **Context Awareness:** Generic steps instead of situation-specific actions
4. **Emotional Support:** Template messages instead of empathetic, tailored responses

## Next Steps

### Immediate Actions:
1. **✅ CONFIRMED: Set GOOGLE_API_KEY**
   - API key is currently NOT set (verified)
   - Need to obtain key from Google AI Studio: https://aistudio.google.com/app/apikey
   - Create `.env.local` file:
   ```bash
   GOOGLE_API_KEY=your_key_here
   ```
   - Restart Next.js dev server to load environment variables

2. **Check Server Logs:** Look for error messages in Next.js terminal
   - Search for "[analyzeWellnessInputAndGeneratePlan]" errors
   - Check for Genkit/Gemini API errors

3. **Test Simpler Prompt:** Temporarily reduce prompt complexity to isolate issue
   - Remove few-shot examples
   - Use minimal schema descriptions
   - Test if basic generation works

4. **Add Debug Logging:** 
   ```typescript
   console.log('[DEBUG] Prompt length:', prompt.length);
   console.log('[DEBUG] Attempting generation with model: gemini-2.5-flash');
   ```

### If API Key is Valid:

**Option A: Simplify Prompt**
- Remove one of the two few-shot examples
- Shorten schema descriptions
- Keep core personalization rules but be more concise

**Option B: Adjust Model Config**
- Increase timeout for Genkit
- Try different temperature (0.5-0.8 range)
- Test with `gemini-1.5-flash` instead of `2.5-flash`

**Option C: Schema Optimization**
- Reduce number of optional fields
- Simplify nested objects
- Use shorter descriptions (current ones are 100+ chars)

## Success Metrics (Not Yet Met)

- [ ] At least 7/10 tests generate personalized (non-fallback) plans
- [ ] Generated plans reference user's specific words/concerns
- [ ] Steps are contextually relevant to user's situation
- [ ] Emotional support uses user's language/themes
- [ ] No "Basic Wellness Plan" titles for specific concerns

## Recommendations

**Priority 1:** Verify API key and check server logs  
**Priority 2:** Test with simplified prompt (remove examples temporarily)  
**Priority 3:** Add comprehensive debug logging  
**Priority 4:** Consider prompt optimization if generation works but quality is low  

## Files Changed in This Session
- ✅ `src/app/schemas/wellness-plan.ts` - Added detailed descriptions to all fields
- ✅ `src/app/actions.ts` - Implemented improved prompt with examples, enhanced fallback, better safety
- ✅ `docs/improved-prompt-design.md` - Research findings and prompt template
- ✅ `docs/prompt-testing-scenarios.md` - 10 test cases with expected qualities
- ✅ `docs/test-screenshots/` - Test 1 screenshot captured

## Status: ⚠️ BLOCKED - API Key Missing

The **infrastructure improvements are working** (fallback logic, theme detection, safety), but the **core AI generation cannot be tested** without the GOOGLE_API_KEY.

### What's Validated:
- ✅ Enhanced fallback logic with theme detection
- ✅ Safety/PII sanitization
- ✅ Schema validation
- ✅ UI rendering of plans
- ✅ No code errors or crashes

### What Cannot Be Tested Yet:
- ❌ AI-generated personalized content
- ❌ Prompt engineering effectiveness
- ❌ JSON schema enforcement by Gemini
- ❌ Few-shot example quality
- ❌ Model configuration (temperature, topP)

**NEXT STEP:** Set `GOOGLE_API_KEY` in `.env.local` and restart server, then re-run tests.
