import { ai } from '@/ai/genkit';
import {NextRequest} from 'next/server';

// IMPORTANT:
// To make streaming work, you need to set the runtime to `edge`.
// Not all models and tools support streaming, so this may not always be an option.
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const { stream } = await ai.generate({
    prompt: messages,
    stream: true,
  });

  return new Response(stream.text());
}
