import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface KidQuestion {
  id: string;
  day: number;
  question: string;
  dateISO: string;
}

interface KidQuestionsState {
  questions: KidQuestion[];
  addQuestion: (day: number, question: string, dateISO: string) => void;
  removeQuestion: (id: string) => void;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Validates kid question text before save. */
export function validateKidQuestion(question: string): string | null {
  const trimmed = question.trim();
  if (!trimmed) return 'Please enter a question.';
  if (trimmed.length > 500) return 'Question is too long (500 characters max).';
  return null;
}

export const useKidQuestions = create<KidQuestionsState>()(
  persist(
    (set) => ({
      questions: [],

      addQuestion: (day, question, dateISO) =>
        set((state) => {
          const trimmed = question.trim();
          if (!trimmed) return state;
          const entry: KidQuestion = {
            id: newId(),
            day,
            question: trimmed,
            dateISO,
          };
          return { questions: [entry, ...state.questions] };
        }),

      removeQuestion: (id) =>
        set((state) => ({
          questions: state.questions.filter((q) => q.id !== id),
        })),
    }),
    {
      name: 'ff-kid-questions',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as KidQuestionsState;
        if (version < 1) {
          if (!state.questions) state.questions = [];
        }
        return state;
      },
    }
  )
);
