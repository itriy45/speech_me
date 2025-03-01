import React from 'react';
import { HistoryProvider } from './context/HistoryContext';
import { DialogueProvider } from './context/dialogue';
import { SpeechStateProvider } from './context/SpeechStateContext';
import { HeaderProvider } from './context/HeaderContext';
import LanguageSettingsModal from './components/modals/LanguageSettingsModal';
import AppRouter from './router';

export default function App() {
  return (
    <SpeechStateProvider>
      <HistoryProvider>
        <DialogueProvider>
          <HeaderProvider>
            <LanguageSettingsModal />
          <AppRouter />
          </HeaderProvider>
        </DialogueProvider>
      </HistoryProvider>
    </SpeechStateProvider>
  );
}