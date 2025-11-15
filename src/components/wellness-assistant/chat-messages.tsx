'use client';

import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { HandInHeart } from '@/components/icons/hand-in-heart';
import { User } from 'lucide-react';
import { BeatLoader } from 'react-spinners';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('');
};

export function ChatMessages({
  messages,
  isLoading,
}: {
  messages: Message[];
  isLoading: boolean;
}) {
  return (
    <div className="space-y-6 p-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn(
            'flex items-start gap-3',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          )}
        >
          {message.role === 'assistant' && (
            <Avatar className="size-8 bg-primary text-primary-foreground">
              <AvatarFallback>
                <HandInHeart className="size-5" />
              </AvatarFallback>
            </Avatar>
          )}
          <div
            className={cn(
              'max-w-md rounded-xl px-4 py-3 shadow',
              message.role === 'user'
                ? 'rounded-br-none bg-primary text-primary-foreground'
                : 'rounded-bl-none bg-card'
            )}
          >
            <p className="whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          </div>
          {message.role === 'user' && (
            <Avatar className="size-8">
              <AvatarFallback>
                <User className="size-5" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex items-start gap-3">
          <Avatar className="size-8 bg-primary text-primary-foreground">
            <AvatarFallback>
              <HandInHeart className="size-5" />
            </AvatarFallback>
          </Avatar>
          <div className="rounded-xl bg-card px-4 py-3 shadow">
            <BeatLoader size={8} color="hsl(var(--primary))" />
          </div>
        </div>
      )}
    </div>
  );
}
