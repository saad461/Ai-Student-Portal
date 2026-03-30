'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LectureData {
  id: string;
  title: string;
  content: string;
}

interface ChatContextType {
  isSupportOpen: boolean;
  isAIOpen: boolean;
  lectureData: LectureData | null;
  toggleSupport: (open?: boolean) => void;
  toggleAI: (open?: boolean) => void;
  setLectureData: (data: LectureData | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [lectureData, setLectureData] = useState<LectureData | null>(null);

  const toggleSupport = (open?: boolean) => {
    const nextState = open !== undefined ? open : !isSupportOpen;
    setIsSupportOpen(nextState);
    if (nextState) setIsAIOpen(false);
  };

  const toggleAI = (open?: boolean) => {
    const nextState = open !== undefined ? open : !isAIOpen;
    setIsAIOpen(nextState);
    if (nextState) setIsSupportOpen(false);
  };

  return (
    <ChatContext.Provider
      value={{
        isSupportOpen,
        isAIOpen,
        lectureData,
        toggleSupport,
        toggleAI,
        setLectureData,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
