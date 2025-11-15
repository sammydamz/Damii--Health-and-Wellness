'use client';

import { WellnessForm } from '@/components/wellness-assistant/wellness-form';
import { WellnessChat } from '@/components/wellness-assistant/wellness-chat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HandInHeart } from '@/components/icons/hand-in-heart';

export default function Home() {
  return (
    <div className="flex flex-col items-center">
        <HandInHeart className="size-16 text-primary" />
        <h1 className="mt-4 text-center font-headline text-4xl font-bold tracking-tight lg:text-5xl">
          How are you feeling today?
        </h1>
        <p className="mt-4 max-w-2xl text-center text-lg text-muted-foreground">
          Your personal wellness assistant. Start the conversation by telling me
          how you feel.
        </p>

      <Tabs defaultValue="form" className="w-full max-w-4xl mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">Wellness Form</TabsTrigger>
          <TabsTrigger value="chat">Chat with DAMII</TabsTrigger>
        </TabsList>
        <TabsContent value="form">
          <WellnessForm />
        </TabsContent>
        <TabsContent value="chat">
          <WellnessChat />
        </TabsContent>
      </Tabs>
    </div>
  );
}
