'use server';
/**
 * @fileOverview Provides personalized wellness tips based on user's feelings.
 *
 * - suggestPersonalizedWellnessTips - A function that suggests wellness tips based on user input.
 * - SuggestPersonalizedWellnessTipsInput - The input type for the suggestPersonalizedWellnessTips function.
 * - SuggestPersonalizedWellnessTipsOutput - The return type for the suggestPersonalizedWellnessTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPersonalizedWellnessTipsInputSchema = z.object({
  feelings: z.string().describe('A description of how the user is feeling, including mental and physical well-being.'),
});
export type SuggestPersonalizedWellnessTipsInput = z.infer<typeof SuggestPersonalizedWellnessTipsInputSchema>;

const SuggestPersonalizedWellnessTipsOutputSchema = z.object({
  wellnessTips: z.string().describe('Actionable, evidence-based suggestions on hydration, sleep hygiene, light exercises and healthy nutrition.'),
});
export type SuggestPersonalizedWellnessTipsOutput = z.infer<typeof SuggestPersonalizedWellnessTipsOutputSchema>;

export async function suggestPersonalizedWellnessTips(input: SuggestPersonalizedWellnessTipsInput): Promise<SuggestPersonalizedWellnessTipsOutput> {
  return suggestPersonalizedWellnessTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPersonalizedWellnessTipsPrompt',
  input: {schema: SuggestPersonalizedWellnessTipsInputSchema},
  output: {schema: SuggestPersonalizedWellnessTipsOutputSchema},
  prompt: `You are a wellness assistant that provides actionable wellness tips based on how the user is feeling.

  Feelings: {{{feelings}}}

  Provide actionable wellness tips related to hydration, sleep hygiene, light exercises and healthy nutrition.`,
});

const suggestPersonalizedWellnessTipsFlow = ai.defineFlow(
  {
    name: 'suggestPersonalizedWellnessTipsFlow',
    inputSchema: SuggestPersonalizedWellnessTipsInputSchema,
    outputSchema: SuggestPersonalizedWellnessTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
