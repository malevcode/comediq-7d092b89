import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LaughTabContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const LaughTabContext = createContext<LaughTabContextType | undefined>(undefined);

export function LaughTabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState('find-shows');

  return (
    <LaughTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </LaughTabContext.Provider>
  );
}

export function useLaughTabContext() {
  const context = useContext(LaughTabContext);
  if (context === undefined) {
    throw new Error('useLaughTabContext must be used within a LaughTabProvider');
  }
  return context;
}
