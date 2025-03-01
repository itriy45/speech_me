import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { HistoryEntry } from '../types/history';

interface HistoryState {
  entries: HistoryEntry[];
}

type HistoryAction = 
  | { type: 'ADD_ENTRY'; payload: HistoryEntry }
  | { type: 'MARK_COMPLETED'; payload: { dialogueId: string; completedAt: Date } }
  | { type: 'CLEAR_HISTORY' };

const initialState: HistoryState = {
  entries: []
};

const HistoryContext = createContext<{
  state: HistoryState;
  dispatch: React.Dispatch<HistoryAction>;
} | undefined>(undefined);

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'ADD_ENTRY':
      return {
        ...state,
        entries: [action.payload, ...state.entries]
      };
    case 'MARK_COMPLETED':
      const updatedEntries = state.entries.map(entry =>
        entry.dialogueId === action.payload.dialogueId
          ? { ...entry, isCompleted: true, completedAt: action.payload.completedAt }
          : entry
      );
      localStorage.setItem('dialogueHistory', JSON.stringify(updatedEntries));
      return {
        ...state,
        entries: updatedEntries
      };
    case 'CLEAR_HISTORY':
      return {
        ...state,
        entries: []
      };
    default:
      return state;
  }
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(historyReducer, {
    entries: JSON.parse(localStorage.getItem('dialogueHistory') || '[]')
  });

  return (
    <HistoryContext.Provider value={{ state, dispatch }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistoryContext() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistoryContext must be used within a HistoryProvider');
  }
  return context;
}