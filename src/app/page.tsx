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
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <HandInHeart className="size-16 text-primary" />
            <h1 className="mt-4 font-headline text-4xl font-bold tracking-tight lg:text-5xl">
              How are you feeling today?
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Describe your current state of mind and body. DAMII is here to
              offer support and guidance.
            </p>
          </div>
        ) : (
          <ChatMessages messages={messages} isLoading={isLoading} />
        )}
      </div>
      <div className="mt-auto p-4">
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
