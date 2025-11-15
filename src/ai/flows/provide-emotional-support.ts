'use server';

/**
 * @fileOverview A flow that provides emotional support to users based on their input.
 *
 * - provideEmotionalSupport - A function that provides emotional support.
 * - EmotionalSupportInput - The input type for the provideEmotionalSupport function.
 * - EmotionalSupportOutput - The return type for the provideEmotionalSupport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EmotionalSupportInputSchema = z.object({
  feelingDescription: z
    .string()
    .describe("A description of how the user is feeling, including mental and physical well-being."),
});
export type EmotionalSupportInput = z.infer<typeof EmotionalSupportInputSchema>;

const EmotionalSupportOutputSchema = z.object({
  emotionalSupport: z.string().describe("Validation, empathy, and coping strategies for managing stress, anxiety, or low mood."),
});
export type EmotionalSupportOutput = z.infer<typeof EmotionalSupportOutputSchema>;

export async function provideEmotionalSupport(input: EmotionalSupportInput): Promise<EmotionalSupportOutput> {
  return provideEmotionalSupportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'emotionalSupportPrompt',
  input: {schema: EmotionalSupportInputSchema},
  output: {schema: EmotionalSupportOutputSchema},
  prompt: `You are an empathetic and supportive AI assistant designed to help users who are feeling down or anxious.

  Based on the user's description of their feelings, provide validation, empathy, and coping strategies for managing stress, anxiety, or low mood.

  User's description: {{{feelingDescription}}}
  `,
});

const provideEmotionalSupportFlow = ai.defineFlow(
  {
    name: 'provideEmotionalSupportFlow',
    inputSchema: EmotionalSupportInputSchema,
    outputSchema: EmotionalSupportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
