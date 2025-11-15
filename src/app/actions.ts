'use server';

import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import type { Message } from '@/lib/types';

// Initialize Genkit and the Google AI plugin within the server-only module.
const ai = genkit({
  plugins: [googleAI()],
});

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
    model: 'gemini-pro',
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
  const history = messages.map((msg) => ({
    role: msg.role,
    content: [{ text: msg.content }],
  }));

  const { text } = await ai.generate({
    model: 'gemini-pro',
    prompt: {
      system: systemPrompt,
      history,
    },
  });

  return text;
}
