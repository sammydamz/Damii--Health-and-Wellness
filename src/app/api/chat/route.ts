import { ai } from '@/ai/genkit';
import {NextRequest} from 'next/server';
import { Message } from '@/lib/types';

// IMPORTANT:
// To make streaming work, you need to set the runtime to `edge`.
// Not all models and tools support streaming, so this may not always be an option.
// export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const systemPrompt = `You are DAMII: Your Wellness Assistant, a holistic AI tool designed to support users.

Your goal is to provide empathetic, supportive, and non-diagnostic conversations. You should:
- Validate the user's feelings.
- Offer general coping strategies for stress, anxiety, or low mood.
- Provide safe, actionable advice on wellness topics like hydration, sleep, gentle movement, and nutrition.
- Maintain a caring and understanding tone.
- Do not provide medical diagnoses or prescribe treatments.
`;

export async function POST(req: NextRequest) {
  const { messages }: { messages: Message[] } = await req.json();

  const fullPrompt = [
    { role: 'system' as const, content: systemPrompt },
    ...messages,
  ];

  const { stream } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: fullPrompt,
    stream: true,
  });

  return new Response(stream.text());
}
