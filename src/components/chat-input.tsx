'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface ChatInputProps {
  input: string;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: ChatInputProps) {
  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex w-full items-center gap-2"
    >
      <Textarea
        value={input}
        onChange={handleInputChange}
        placeholder="e.g., I have low energy, feel anxious..."
        className="min-h-12 max-h-48 flex-1 resize-none rounded-xl border-2 border-input p-3 pr-12 text-base shadow-sm focus:border-primary"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
          }
        }}
        disabled={isLoading}
      />
      <Button
        type="submit"
        size="icon"
        className="absolute bottom-2 right-2 size-8 rounded-full"
        disabled={isLoading || !input.trim()}
      >
        <Send className="size-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}
