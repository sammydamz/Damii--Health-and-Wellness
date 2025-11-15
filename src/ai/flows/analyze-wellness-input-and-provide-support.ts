'use server';
/**
 * @fileOverview This file defines a Genkit flow that analyzes user input about their wellness and provides empathetic support and personalized wellness tips.
 *
 * - analyzeWellnessInputAndProvideSupport - A function that takes user input and returns emotional support and wellness tips.
 * - AnalyzeWellnessInput - The input type for the analyzeWellnessInputAndProvideSupport function.
 * - WellnessSupportOutput - The return type for the analyzeWellnessInputAndProvideSupport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeWellnessInputSchema = z.object({
  userInput: z.string().describe('A description of how the user is feeling, including both mental and physical well-being.'),
});
export type AnalyzeWellnessInput = z.infer<typeof AnalyzeWellnessInputSchema>;

const WellnessSupportOutputSchema = z.object({
  emotionalSupport: z.string().describe('Empathetic support and coping strategies for managing stress, anxiety, or low mood.'),
  wellnessTips: z.string().describe('Actionable, evidence-based suggestions on hydration, sleep hygiene, light exercises, and healthy nutrition.'),
});
export type WellnessSupportOutput = z.infer<typeof WellnessSupportOutputSchema>;

export async function analyzeWellnessInputAndProvideSupport(input: AnalyzeWellnessInput): Promise<WellnessSupportOutput> {
  return analyzeWellnessInputAndProvideSupportFlow(input);
}

const wellnessPrompt = ai.definePrompt({
  name: 'wellnessPrompt',
  input: {schema: AnalyzeWellnessInputSchema},
  output: {schema: WellnessSupportOutputSchema},
  model: 'googleai/gemini-2.5-flash',
  prompt: `You are DAMII: Your Wellness Assistant, a holistic tool designed to support users who are feeling down or experiencing general health and wellness concerns. Provide a supportive and non-diagnostic response.

  User Input: {{{userInput}}}

  Instructions: Analyze the user input and provide a structured response in two main sections:

  1.  Emotional Support & Psychology: Offer validation, empathy, and general coping strategies for stress, anxiety, or low mood.
  2.  General Wellness Tips: Provide safe, actionable advice on things like hydration, sleep hygiene, gentle movement, and nutrition to address physical discomfort or low energy.

  Output:
  `,
});

const analyzeWellnessInputAndProvideSupportFlow = ai.defineFlow(
  {
    name: 'analyzeWellnessInputAndProvideSupportFlow',
    inputSchema: AnalyzeWellnessInputSchema,
    outputSchema: WellnessSupportOutputSchema,
  },
  async input => {
    const {output} = await wellnessPrompt(input);
    return output!;
  }
);
