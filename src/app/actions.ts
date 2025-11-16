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
  // 1) Quick sanitize / PII removal
  const sanitized = userInput.replace(/\b\S+@\S+\.\S+\b/g, '[email]');

  // 2) Quick safety regex check
  const safetyRegex = /\b(suicid|kill myself|hurt myself|end my life|self harm|cut myself)\b/i;
  if (safetyRegex.test(sanitized)) {
    return {
      emotionalSupport: 'I\'m sorry you\'re feeling this way. If you are in immediate danger, please contact local emergency services or a crisis hotline immediately.',
      wellnessTips: 'National Suicide Prevention Lifeline: 988 (US) or visit https://988lifeline.org/',
      personalizedPlan: {
        id: `safety-redirect-${Date.now()}`,
        title: 'Immediate Support Needed',
        overview: 'We detected language that may indicate you\'re in crisis. Your safety is the top priority.',
        summaryBullets: [
          'Contact emergency services (911) if you\'re in immediate danger',
          'Call the National Suicide Prevention Lifeline: 988',
          'Reach out to a trusted friend, family member, or mental health professional',
        ],
        steps: [
          {
            id: '1',
            text: 'Call 988 or your local emergency number',
            category: 'other',
            priority: 'high',
            when: 'immediately',
          }
        ],
        estimatedEffort: 'low',
        timeframe: 'immediate'
      },
      safetyFlag: true,
      safetyMessage: 'Detected language that may indicate imminent risk. Crisis resources provided.'
    } as WellnessPlanOutput;
  }

  // 3) Build a detailed prompt for structured plan generation
  const prompt = `You are DAMII, a compassionate and non-diagnostic wellness assistant. Based on the user's check-in below, generate a personalized wellness plan in JSON format that strictly matches the provided schema.

User Input: "${sanitized}"

Requirements:
- Provide empathetic emotional support (2-3 sentences)
- Offer evidence-based wellness tips (hydration, sleep, movement, nutrition)
- Create a personalized plan with:
  - A clear title and overview
  - 3-6 summary bullets highlighting key actions
  - 3-8 actionable steps (each ≤120 chars), categorized by type
  - Estimated effort level (low/medium/high)
  - Realistic timeframe (e.g., "1 week", "2 weeks")
- Keep steps micro-action focused and achievable
- If you detect any red flags (self-harm, severe depression), set safetyFlag to true and provide crisis resources in safetyMessage

Output ONLY valid JSON matching this schema:
{
  "emotionalSupport": "string",
  "wellnessTips": "string",
  "personalizedPlan": {
    "id": "string (generate unique ID)",
    "title": "string",
    "overview": "string",
    "summaryBullets": ["string"],
    "steps": [{
      "id": "string",
      "text": "string",
      "category": "movement|sleep|hydration|nutrition|social|breathing|cognitive|other",
      "durationMinutes": number (optional),
      "frequency": "string (optional)",
      "priority": "low|medium|high (optional)",
      "when": "string (optional)",
      "safety": "string (optional)",
      "followUpQuestion": "string (optional)"
    }],
    "estimatedEffort": "low|medium|high",
    "timeframe": "string"
  },
  "safetyFlag": boolean (optional),
  "safetyMessage": "string (optional)"
}`;

  // 4) Call genkit AI
  try {
    const { output } = await ai.generate({
      model: 'gemini-2.5-flash',
      prompt,
      output: { schema: WellnessPlanSchema }
    });

    // 5) Validate and return
    return output as WellnessPlanOutput;
  } catch (error) {
    console.error('AI call failed, attempting retry', error);
    
    // Retry with simpler prompt
    try {
      const retryPrompt = prompt + '\n\nIMPORTANT: Return ONLY valid JSON. Do not include any explanatory text before or after the JSON.';
      const { text } = await ai.generate({ 
        model: 'gemini-2.5-flash', 
        prompt: retryPrompt 
      });
      
      const parsed = JSON.parse(text || '{}');
      return WellnessPlanSchema.parse(parsed);
    } catch (retryError) {
      console.error('Failed to parse AI response on retry', retryError);
      
      // Fallback safe response
      return {
        emotionalSupport: 'Thank you for sharing. I\'m here to support you on your wellness journey.',
        wellnessTips: 'Consider staying hydrated, getting adequate sleep, and moving your body regularly.',
        personalizedPlan: {
          id: `fallback-${Date.now()}`,
          title: 'Basic Wellness Plan',
          overview: 'A simple plan to get started with self-care.',
          summaryBullets: [
            'Drink 8 glasses of water daily',
            'Aim for 7-9 hours of sleep',
            'Take short walks throughout the day'
          ],
          steps: [
            {
              id: '1',
              text: 'Drink a glass of water when you wake up',
              category: 'hydration',
              durationMinutes: 5,
              priority: 'medium',
              when: 'morning'
            },
            {
              id: '2',
              text: 'Take a 10-minute walk',
              category: 'movement',
              durationMinutes: 10,
              frequency: 'daily',
              priority: 'medium'
            }
          ],
          estimatedEffort: 'low',
          timeframe: '1 week'
        },
        safetyFlag: false,
        safetyMessage: null
      } as WellnessPlanOutput;
    }
  }
}
