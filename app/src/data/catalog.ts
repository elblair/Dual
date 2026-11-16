/** The fixed choices the app offers (not user data): hobbies and daily-minute options. */

/** Every duel lasts this many days (the API enforces the same rule and sends it back as `lengthDays`). */
export const DUEL_DAYS = 7;

export interface Hobby {
  id: string;
  label: string;
  /** Today card title: "{action} 20 min". */
  action: string;
  /** Used in the invite text: "I'm {phrase} 20 min a day this week." */
  phrase: string;
  emoji: string;
}

export const HOBBIES: Hobby[] = [
  { id: 'guitar', label: 'Guitar', action: 'Practice guitar', phrase: 'practicing guitar', emoji: '🎸' },
  { id: 'running', label: 'Running', action: 'Go for a run', phrase: 'running', emoji: '🏃' },
  { id: 'spanish', label: 'Spanish', action: 'Study Spanish', phrase: 'studying Spanish', emoji: '🗣️' },
  { id: 'gym', label: 'Gym', action: 'Hit the gym', phrase: 'hitting the gym', emoji: '🏋️' },
  { id: 'reading', label: 'Reading', action: 'Read', phrase: 'reading', emoji: '📚' },
  { id: 'drawing', label: 'Drawing', action: 'Draw', phrase: 'drawing', emoji: '🎨' },
  { id: 'cooking', label: 'Cooking', action: 'Cook', phrase: 'cooking', emoji: '🍳' },
  { id: 'coding', label: 'Coding', action: 'Code', phrase: 'coding', emoji: '💻' },
  { id: 'meditation', label: 'Meditation', action: 'Meditate', phrase: 'meditating', emoji: '🧘' },
];

export function hobbyById(id: string): Hobby {
  return HOBBIES.find((h) => h.id === id) ?? HOBBIES[0];
}

/** Starter goal choices the pencil on the Hobby screen cycles through. */
export const MINUTE_OPTIONS = [10, 15, 20, 30, 45];

/** The lighter goal offered after a duel: half the minutes, rounded down to 5, never below 5 (same rule as the API). */
export function easierMinutes(minutes: number): number {
  return Math.max(5, Math.floor(Math.floor(minutes / 2) / 5) * 5);
}
