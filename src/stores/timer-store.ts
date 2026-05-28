"use client";

import { create } from "zustand";

export type TimerMode = "pomodoro" | "free" | "reverse" | "custom";

interface TimerState {
  mode: TimerMode;
  running: boolean;
  startedAt: number | null;
  elapsedSeconds: number;
  targetSeconds: number;
  subjectId: string | null;

  start: (subjectId?: string) => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  setMode: (mode: TimerMode) => void;
  setTarget: (seconds: number) => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  mode: "pomodoro",
  running: false,
  startedAt: null,
  elapsedSeconds: 0,
  targetSeconds: 25 * 60,
  subjectId: null,

  start: (subjectId) => {
    if (get().running) return;
    set({
      running: true,
      startedAt: Date.now() - get().elapsedSeconds * 1000,
      subjectId: subjectId ?? get().subjectId,
    });
  },

  pause: () => set({ running: false }),

  reset: () =>
    set({
      running: false,
      startedAt: null,
      elapsedSeconds: 0,
    }),

  tick: () => {
    const { running, startedAt } = get();
    if (!running || !startedAt) return;
    set({ elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000) });
  },

  setMode: (mode) => {
    const targets: Record<TimerMode, number> = {
      pomodoro: 25 * 60,
      free: 0,
      reverse: 60 * 60,
      custom: 50 * 60,
    };
    set({
      mode,
      targetSeconds: targets[mode],
      elapsedSeconds: 0,
      running: false,
      startedAt: null,
    });
  },

  setTarget: (seconds) => set({ targetSeconds: seconds }),
}));
