'use server';

import {ai} from '@/ai/genkit';
import type {Message} from '@/lib/types';

const systemPrompt = `You are DAMII: Your Wellness Assistant, a holistic AI tool designed to support users.

- Your responses should be empathetic, supportive, and non-diagnostic.
- Offer validation, general coping strategies for stress, and safe, actionable wellness tips.
- You are not a doctor, so do not provide medical advice.
- Keep your responses concise and easy to understand.`;

export async function getChatResponse(messages: Message[]): Promise<string> {
  const history = messages.map(msg => ({
    role: msg.role,
    content: [{text: msg.content}],
  }));

  const {text} = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: {
      system: systemPrompt,
      history,
    },
  });

  return text;
}
