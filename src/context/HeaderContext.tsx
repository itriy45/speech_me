import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSpeechState } from './SpeechStateContext';

interface HeaderContextType {
  isHeaderVisible: boolean;
  showHeader: () => void;
  hideHeader: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const { state: speechState } = useSpeechState();
  const hideTimeoutRef = React.useRef<NodeJS.Timeout>();

  const showHeader = useCallback(() => {
    setIsHeaderVisible(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  }, []);

  const hideHeader = useCallback(() => {
    setIsHeaderVisible(false);
  }, []);

  // Auto-hide header during speech/recording
  useEffect(() => {
    if (speechState.isRecording || speechState.isSpeaking) {
      hideHeader();
    } else {
      // Show header briefly after interaction ends
      showHeader();
      hideTimeoutRef.current = setTimeout(() => {
        hideHeader();
      }, 3000);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [speechState.isRecording, speechState.isSpeaking, hideHeader, showHeader]);

  return (
    <HeaderContext.Provider value={{ isHeaderVisible, showHeader, hideHeader }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
}