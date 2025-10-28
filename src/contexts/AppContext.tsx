import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppData {
  telegramLinked: boolean;
  gcalLinked: boolean;
  proactiveScheduling?: boolean;
  userEmail?: string;
  userId?: string;
  selectedPlatform?: 'telegram' | 'whatsapp';
  preselectedPhone?: string; // phone (E.164 preferred) provided via deep link
}

interface AppContextType {
  appData: AppData;
  setAppData: React.Dispatch<React.SetStateAction<AppData>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [appData, setAppData] = useState<AppData>({
    telegramLinked: false,
    gcalLinked: false,
    proactiveScheduling: false,
  });

  // Debug logging for app data changes
  React.useEffect(() => {
    console.log('AppContext: App data updated:', appData);
  }, [appData]);

  return (
    <AppContext.Provider value={{ appData, setAppData }}>
      {children}
    </AppContext.Provider>
  );
};