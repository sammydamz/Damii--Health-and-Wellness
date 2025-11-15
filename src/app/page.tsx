'use client';

import { ChatInput } from '@/components/wellness-assistant/chat-input';
import { ChatMessages } from '@/components/wellness-assistant/chat-messages';
import { useChat } from '@/hooks/use-chat';
import { HandInHeart } from '@/components/icons/hand-in-heart';

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: '/api/chat',
    });

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      <div className="flex-1 overflow-y-auto">
        {messages.length > 0 ? (
          <ChatMessages messages={messages} isLoading={isLoading} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <HandInHeart className="size-16 text-primary" />
            <h1 className="mt-4 font-headline text-4xl font-bold tracking-tight lg:text-5xl">
              Chat with DAMII
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Your personal wellness assistant. Start the conversation by telling me
              how you feel.
            </p>
          </div>
        )}
      </div>
      <div className="bg-background/95 p-4 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl">
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
