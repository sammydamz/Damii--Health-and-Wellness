'use server';

import { z } from 'genkit';
import { ai } from '@/ai/genkit';
import type { Message } from '@/lib/types';

// Combined Wellness Flow
const WellnessSupportOutputSchema = z.object({
  emotionalSupport: z
    .string()
    .describe(
      'Empathetic support and coping strategies for managing stress, anxiety, or low mood.'
    ),
  wellnessTips: z
    .string()
    .describe(
      'Actionable, evidence-based suggestions on hydration, sleep hygiene, light exercises, and healthy nutrition.'
    ),
});
export type WellnessSupportOutput = z.infer<typeof WellnessSupportOutputSchema>;

export async function analyzeWellnessInputAndProvideSupport(
  userInput: string
): Promise<WellnessSupportOutput> {
  const prompt = `You are DAMII: Your Wellness Assistant, a holistic tool designed to support users who are feeling down or experiencing general health and wellness concerns. Provide a supportive and non-diagnostic response.

  User Input: ${userInput}

  Instructions: Analyze the user input and provide a structured response in two main sections:

  1.  Emotional Support & Psychology: Offer validation, empathy, and general coping strategies for stress, anxiety, or low mood.
  2.  General Wellness Tips: Provide safe, actionable advice on things like hydration, sleep hygiene, gentle movement, and nutrition to address physical discomfort or low energy.

  Output:
  `;

  const { output } = await ai.generate({
    model: 'gemini-1.5-flash',
    prompt,
    output: { schema: WellnessSupportOutputSchema },
  });

  return output!;
}

// Chat Flow
const systemPrompt = `You are DAMII: Your Wellness Assistant, a holistic AI tool designed to support users.

- Your responses should be empathetic, supportive, and non-diagnostic.
- Offer validation, general coping strategies for stress, and safe, actionable wellness tips.
- You are not a doctor, so do not provide medical advice.
- Keep your responses concise and easy to understand.`;

export async function getChatResponse(messages: Message[]): Promise<string> {
  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role,
    content: [{ text: msg.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  const { text } = await ai.generate({
    model: 'gemini-1.5-flash',
    prompt: lastMessage.content,
    history,
    config: {
        system: systemPrompt,
    },
  });

  return text;
}

// Personalized Wellness Plan Generation
import { WellnessPlanSchema, type WellnessPlanOutput } from '@/app/schemas/wellness-plan';

export async function analyzeWellnessInputAndGeneratePlan(userInput: string): Promise<WellnessPlanOutput> {
  // 1) Enhanced PII sanitization
  let sanitized = userInput
    .replace(/\b\S+@\S+\.\S+\b/g, '[email]')                    // Email addresses
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone]')       // Phone numbers (US format)
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[ssn]')                 // SSN
    .replace(/\b\d{16}\b/g, '[credit-card]');                   // Credit card (basic)

  // Limit input length for safety
  if (sanitized.length > 2000) {
    sanitized = sanitized.substring(0, 2000) + '... [truncated for length]';
  }

  // 2) Multi-layer safety check
  const criticalKeywords = /\b(suicid(e|al)|kill myself|hurt myself|end my life|self[- ]harm|cut myself|want to die|overdose|no reason to live)\b/i;
  const concerningKeywords = /\b(hopeless|worthless|can'?t go on|unbearable|severe depression|crisis|emergency)\b/i;
  
  const isCritical = criticalKeywords.test(sanitized);
  const isConcerning = concerningKeywords.test(sanitized);

  if (isCritical) {
    // Immediate crisis response
    return {
      emotionalSupport: 'I\'m truly sorry you\'re experiencing these thoughts. Your safety is the most important thing right now. Please reach out to immediate professional support.',
      wellnessTips: 'Crisis resources: National Suicide Prevention Lifeline (988) available 24/7, Crisis Text Line (text HOME to 741741), or call 911 if in immediate danger. You are not alone, and help is available.',
      personalizedPlan: {
        id: `crisis-support-${Date.now()}`,
        title: 'Immediate Crisis Support Resources',
        overview: 'We detected language indicating you may be in crisis. Your safety is the absolute priority. Please contact one of these resources immediately.',
        summaryBullets: [
          'Call 988 (National Suicide Prevention Lifeline) - free, confidential, 24/7',
          'Text HOME to 741741 (Crisis Text Line) for immediate text support',
          'Call 911 or go to your nearest emergency room if in immediate danger',
          'Reach out to a trusted friend, family member, or mental health professional right now'
        ],
        steps: [
          {
            id: '1',
            text: 'Call 988 now for immediate support',
            category: 'other',
            priority: 'high',
            when: 'immediately',
            safety: 'If you are in immediate danger, call 911 instead'
          },
          {
            id: '2',
            text: 'Remove access to any means of self-harm if possible',
            category: 'other',
            priority: 'high',
            when: 'immediately',
            safety: 'Ask a trusted person for help if needed'
          },
          {
            id: '3',
            text: 'Stay with someone or in a safe public place until help arrives',
            category: 'social',
            priority: 'high',
            when: 'immediately'
          }
        ],
        estimatedEffort: 'low',
        timeframe: 'immediate'
      },
      safetyFlag: true,
      safetyMessage: 'CRITICAL: Detected language indicating potential self-harm or suicide risk. Crisis intervention resources provided. If this is an error, please rephrase your input.'
    } as WellnessPlanOutput;
  }

  if (isConcerning) {
    // Add safety context to prompt for model awareness
    sanitized = `[SAFETY NOTE: User input contains concerning language. Please provide gentle, supportive guidance and encourage professional mental health support if appropriate.]\n\n${sanitized}`;
  }

  // 3) Build a comprehensive, personalized prompt
  const prompt = `# ROLE
You are DAMII, a compassionate wellness assistant designed to create personalized, actionable wellness plans. You are NOT a medical professional and do not diagnose or prescribe.

# USER CONTEXT
User Input: "${sanitized}"

# TASK
Create a PERSONALIZED wellness plan that:
1. **Directly addresses their specific concerns** mentioned in their input
2. **Reflects their emotional state** with genuine empathy
3. **Provides tailored steps** fitting their life context (work stress → desk exercises; parent → quick 5-min activities)
4. **Uses their language/themes** (if they say "burnt out", acknowledge that term)
5. **Sets realistic expectations** based on their apparent capacity
6. **Includes 4-8 micro-actions** (each ≤120 chars, doable in 5-30 mins)
7. **Balances wellness dimensions** (movement, sleep, hydration, breathing, nutrition, social, cognitive)

# PERSONALIZATION RULES
- Work/job stress → include desk-friendly or lunch-break activities
- Family/kids → brief activities fitting parenting schedules  
- Anxiety → prioritize breathing exercises and grounding techniques
- Low mood → include social connection and sunlight exposure
- Physical symptoms (headaches, fatigue) → focus on hydration, sleep, gentle movement
- Overwhelmed → LOW effort, SHORT timeframe (3-7 days)
- Motivated tone → MEDIUM effort, longer timeframe (2-4 weeks)

# SAFETY DETECTION
If input contains self-harm, suicide, severe depression, or crisis language:
- Set "safetyFlag": true
- Provide crisis resources in "safetyMessage" (e.g., "988 Lifeline")
- Keep plan very gentle, encourage professional support

# EXAMPLES

## Example 1: Work Stress & Sleep
Input: "I'm so stressed from work deadlines and can't sleep at night. I feel exhausted all day."
{
  "emotionalSupport": "It sounds like work pressure is taking a real toll on your sleep and energy. That cycle of stress and exhaustion is tough, but small changes can help break it.",
  "wellnessTips": "Prioritize a wind-down routine 1 hour before bed—no screens, try deep breathing or reading. Stay hydrated during the day, and consider a 15-minute walk at lunch to regulate stress hormones.",
  "personalizedPlan": {
    "id": "plan-${Date.now()}",
    "title": "Stress Relief & Sleep Reset Plan",
    "overview": "A 2-week plan to reduce work-related stress and improve sleep quality through relaxation techniques, boundary-setting, and sleep hygiene adjustments.",
    "summaryBullets": [
      "Establish a consistent bedtime routine to signal your body it's time to rest",
      "Practice 5-minute breathing exercises when work stress peaks",
      "Limit caffeine after 2 PM to support better sleep",
      "Take short movement breaks to reduce physical tension from desk work"
    ],
    "steps": [
      {"id": "1", "text": "Set a daily alarm for bedtime routine (9:30 PM)", "category": "sleep", "durationMinutes": 5, "frequency": "daily", "priority": "high", "when": "evening"},
      {"id": "2", "text": "Practice 4-7-8 breathing when feeling overwhelmed", "category": "breathing", "durationMinutes": 5, "frequency": "as needed", "priority": "high", "when": "during work stress"},
      {"id": "3", "text": "Switch to herbal tea after lunch", "category": "nutrition", "priority": "medium", "when": "afternoon"},
      {"id": "4", "text": "Take a 10-minute walk at lunch break", "category": "movement", "durationMinutes": 10, "frequency": "weekdays", "priority": "medium", "when": "midday"},
      {"id": "5", "text": "Dim lights and avoid screens 1 hour before bed", "category": "sleep", "durationMinutes": 60, "frequency": "daily", "priority": "high", "when": "evening"}
    ],
    "estimatedEffort": "medium",
    "timeframe": "2 weeks"
  }
}

## Example 2: Low Energy & Poor Nutrition
Input: "I've been feeling really low energy and just eating junk food. I know I need to change but I'm too tired to cook."
{
  "emotionalSupport": "Low energy and quick food choices often feed into each other—it's a common cycle. You're already aware you want to make changes, which is the first step. Let's start with small, energy-friendly adjustments.",
  "wellnessTips": "Focus on hydration first (even mild dehydration zaps energy). Try simple, no-cook nutritious options like Greek yogurt with berries, hummus with veggies, or pre-cut fruit. Short walks can actually boost energy more than caffeine.",
  "personalizedPlan": {
    "id": "plan-${Date.now()}",
    "title": "Energy Boost Through Simple Nutrition",
    "overview": "A 1-week starter plan to increase energy levels through easy nutrition swaps, hydration, and gentle movement—no complicated cooking required.",
    "summaryBullets": [
      "Start each day with a glass of water to combat dehydration-related fatigue",
      "Stock up on grab-and-go nutritious snacks (nuts, fruit, yogurt)",
      "Add one 10-minute walk daily to naturally increase energy",
      "Swap one processed meal per day for a simple whole-food option"
    ],
    "steps": [
      {"id": "1", "text": "Drink a full glass of water first thing in the morning", "category": "hydration", "durationMinutes": 2, "frequency": "daily", "priority": "high", "when": "morning"},
      {"id": "2", "text": "Prep 3 grab-and-go snacks each evening (e.g., apple + almonds)", "category": "nutrition", "durationMinutes": 10, "frequency": "daily", "priority": "high", "when": "evening"},
      {"id": "3", "text": "Take a 10-minute walk after waking up or during lunch", "category": "movement", "durationMinutes": 10, "frequency": "daily", "priority": "medium", "when": "morning or midday"},
      {"id": "4", "text": "Replace one processed snack with whole food (banana, carrots, etc.)", "category": "nutrition", "frequency": "daily", "priority": "medium", "when": "snack time"},
      {"id": "5", "text": "Aim for 6-8 glasses of water throughout the day", "category": "hydration", "frequency": "daily", "priority": "high", "when": "all day"}
    ],
    "estimatedEffort": "low",
    "timeframe": "1 week"
  }
}

# OUTPUT FORMAT
Return ONLY valid JSON matching the WellnessPlanOutput schema. No markdown formatting, no explanatory text—just pure JSON.

Generate the personalized plan now:`;

  // 4) Call Genkit AI with optimized config
  try {
    const { output } = await ai.generate({
      model: 'gemini-2.5-flash',
      prompt,
      output: { schema: WellnessPlanSchema },
      config: {
        temperature: 0.7,  // Balance creativity with consistency
        topP: 0.9,
        topK: 40,
      }
    });

    if (!output) {
      throw new Error('No output generated from model');
    }

    // 5) Return validated output
    return output as WellnessPlanOutput;
  } catch (error) {
    console.error('[analyzeWellnessInputAndGeneratePlan] Initial generation failed:', error);
    
    // Retry with simplified prompt emphasizing JSON-only output
    try {
      const retryPrompt = prompt + '\n\nCRITICAL: You MUST return ONLY valid JSON. Do not wrap in markdown code blocks. Do not add any text before or after the JSON object.';
      
      const { text } = await ai.generate({ 
        model: 'gemini-2.5-flash', 
        prompt: retryPrompt,
        config: {
          temperature: 0.5,  // Lower temperature for more predictable output
          topP: 0.8,
        }
      });
      
      if (!text) {
        throw new Error('No text output from retry');
      }

      // Try to extract JSON if wrapped in markdown
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      
      const parsed = JSON.parse(cleanedText);
      const validated = WellnessPlanSchema.parse(parsed);
      
      console.log('[analyzeWellnessInputAndGeneratePlan] Retry successful after JSON cleanup');
      return validated;
    } catch (retryError) {
      console.error('[analyzeWellnessInputAndGeneratePlan] Retry also failed:', retryError);
      
      // Generate context-aware fallback based on detected themes
      const inputLower = sanitized.toLowerCase();
      const themes = {
        sleep: /sleep|insomnia|tired|exhausted|fatigue/i.test(inputLower),
        stress: /stress|anxious|anxiety|overwhelm|pressure|worry/i.test(inputLower),
        energy: /energy|tired|fatigue|exhausted|drained/i.test(inputLower),
        mood: /sad|depressed|down|low mood|hopeless|lonely/i.test(inputLower),
        nutrition: /eat|food|nutrition|diet|hungry|appetite/i.test(inputLower),
      };

      let title = 'Basic Wellness Plan';
      let overview = 'A simple plan to get started with self-care and build healthy habits.';
      let summaryBullets = [
        'Drink 8 glasses of water daily to support overall health',
        'Aim for 7-9 hours of quality sleep each night',
        'Take short walks throughout the day to boost mood and energy'
      ];
      let steps: any[] = [
        {
          id: '1',
          text: 'Drink a glass of water when you wake up',
          category: 'hydration',
          durationMinutes: 2,
          priority: 'high',
          when: 'morning'
        },
        {
          id: '2',
          text: 'Take a 10-minute walk',
          category: 'movement',
          durationMinutes: 10,
          frequency: 'daily',
          priority: 'medium',
          when: 'morning or afternoon'
        }
      ];

      // Customize fallback based on detected themes
      if (themes.stress) {
        title = 'Stress Management Starter Plan';
        overview = 'A gentle plan to begin managing stress through breathing, movement, and self-care.';
        summaryBullets = [
          'Practice simple breathing exercises when feeling overwhelmed',
          'Take short breaks throughout the day to reset',
          'Prioritize one relaxing activity before bed'
        ];
        steps.push({
          id: '3',
          text: 'Practice 4-7-8 breathing: inhale 4 counts, hold 7, exhale 8',
          category: 'breathing',
          durationMinutes: 5,
          frequency: 'as needed',
          priority: 'high',
          when: 'when feeling stressed'
        });
      }

      if (themes.sleep) {
        title = 'Sleep Support Starter Plan';
        overview = 'A foundational plan to improve sleep quality through consistent routines and sleep hygiene.';
        summaryBullets.push('Establish a consistent bedtime routine to signal sleep time');
        steps.push({
          id: '4',
          text: 'Set a consistent bedtime and wake time (even weekends)',
          category: 'sleep',
          priority: 'high',
          when: 'evening and morning'
        });
      }

      if (themes.nutrition) {
        steps.push({
          id: '5',
          text: 'Add one serving of vegetables to lunch or dinner',
          category: 'nutrition',
          frequency: 'daily',
          priority: 'medium',
          when: 'meals'
        });
      }

      return {
        emotionalSupport: 'Thank you for sharing how you\'re feeling. Taking the first step to focus on your wellness is meaningful. This plan offers a gentle starting point—you can adjust it as you go.',
        wellnessTips: 'Start with small, achievable changes rather than trying to overhaul everything at once. Consistency matters more than perfection. Stay hydrated, move your body regularly, and prioritize rest.',
        personalizedPlan: {
          id: `fallback-${Date.now()}`,
          title,
          overview,
          summaryBullets,
          steps,
          estimatedEffort: 'low',
          timeframe: '1 week'
        },
        safetyFlag: false,
        safetyMessage: null
      } as WellnessPlanOutput;
    }
  }
}
