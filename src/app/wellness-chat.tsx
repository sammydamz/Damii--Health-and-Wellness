'use client';

import { ChatInput } from '@/components/chat-input';
import { ChatMessages } from '@/components/chat-messages';
import { useChat } from '@/hooks/use-chat';
import { Card, CardContent } from '@/components/ui/card';
import { getChatResponse } from '@/app/actions';

export function WellnessChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      async onSend(messages) {
        return getChatResponse(messages);
      },
    });

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex h-[60vh] flex-col">
          <div className="flex-1 overflow-y-auto">
            {messages.length > 0 ? (
              <ChatMessages messages={messages} isLoading={isLoading} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center p-4">
                <h2 className="font-headline text-2xl font-bold tracking-tight">
                  Chat with DAMII
                </h2>
                <p className="mt-2 max-w-md text-muted-foreground">
                  Have a conversation with your personal wellness assistant.
                  You can describe how you are feeling, ask for advice, or just talk.
                </p>
              </div>
            )}
          </div>
          <div className="bg-background/95 p-4 backdrop-blur-sm border-t">
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
      </CardContent>
    </Card>
  );
}
