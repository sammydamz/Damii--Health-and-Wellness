'use client';

import { useState, useCallback } from 'react';
import type { Message } from '@/lib/types';
import { useToast } from './use-toast';

export const useChat = ({ api }: { api: string }) => {
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
      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      try {
        const response = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [...messages, userMessage] }),
        });

        if (!response.body) {
          throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = '';

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '' },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          assistantMessage += decoder.decode(value, { stream: true });

          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].content = assistantMessage;
            return newMessages;
          });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description:
            error instanceof Error ? error.message : 'Please try again.',
        });
        setMessages((prev) => prev.slice(0, -1)); // Remove user message on error
      } finally {
        setIsLoading(false);
      }
    },
    [input, messages, api, toast]
  );

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  };
};
