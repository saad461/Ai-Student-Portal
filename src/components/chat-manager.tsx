'use client';

import { FloatingChat } from '@/components/floating-chat';
import { AIAssistant } from '@/components/ai-assistant';
import { ChatTriggers } from '@/components/chat-triggers';
import { useChat } from '@/components/chat-context';

export function ChatManager() {
  const { lectureData } = useChat();

  return (
    <>
      <FloatingChat />
      {lectureData && <AIAssistant />}
      <ChatTriggers />
    </>
  );
}
