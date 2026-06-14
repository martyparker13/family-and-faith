import { create } from 'zustand';

import type { Celebration } from '@/lib/celebrate';

/**
 * Tiny non-persisted event bus for celebrations. Screens call `fire()` and
 * the global overlay in app/_layout.tsx renders the confetti above
 * everything — independent of scroll positions.
 */
interface CelebrationState {
  burst: number;
  message: string | null;
  size: 'small' | 'big';
  fire: (celebration: Celebration) => void;
}

export const useCelebration = create<CelebrationState>()((set) => ({
  burst: 0,
  message: null,
  size: 'small',
  fire: ({ message, size }) => set((s) => ({ burst: s.burst + 1, message, size })),
}));
