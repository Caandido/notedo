export const SETTINGS_STORAGE_KEY = "notedo:settings:v1";

export type TimerDefaults = {
  pomodoroSeconds: number;
  customSeconds: number;
  reverseSeconds: number;
};

export type UserSettings = {
  timer: TimerDefaults;
};

export const DEFAULT_SETTINGS: UserSettings = {
  timer: {
    pomodoroSeconds: 25 * 60,
    customSeconds: 50 * 60,
    reverseSeconds: 60 * 60,
  },
};

export function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      timer: { ...DEFAULT_SETTINGS.timer, ...(parsed.timer ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
