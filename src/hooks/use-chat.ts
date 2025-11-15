'use client';

import { useState, useCallback } from 'react';
import type { Message } from '@/lib/types';
import { useToast } from './use-toast';

interface UseChatOptions {
  onSend: (messages: Message[]) => Promise<string>;
}

export const useChat = ({ onSend }: UseChatOptions) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = useCallback(
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      setInput(e.target.value);
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input) return;

      setIsLoading(true);
      const userMessage: Message = { role: 'user', content: input };
      const newMessages: Message[] = [...messages, userMessage];
      setMessages(newMessages);
      setInput('');

      try {
        const assistantResponse = await onSend(newMessages);
        
        const assistantMessage: Message = { role: 'assistant', content: assistantResponse };
        setMessages((prev) => [...prev, assistantMessage]);

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description:
            error instanceof Error ? error.message : 'Please try again.',
        });
        // On error, remove the optimistic user message.
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [input, messages, onSend, toast]
  );

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  };
};
