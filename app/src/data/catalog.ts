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

/** A written goal is trimmed and at most this many characters (the API enforces the same rule). */
export const GOAL_MAX = 60;

/** The suggestion shown until the player writes their own: "Practice guitar 20 min a day". */
export function defaultGoal(hobbyId: string, minutes: number): string {
  return `${hobbyById(hobbyId).action} ${minutes} min a day`;
}

/** An error message for a goal that is not allowed, or null when it is fine. */
export function validateGoal(text: string): string | null {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'Write a goal, or tap “Use the suggestion”.';
  if (trimmed.length > GOAL_MAX) return `Keep it under ${GOAL_MAX} characters.`;
  return null;
}

const STANDALONE_NUMBER = /(?<![\d])\d{1,3}(?![\d])/;

/** The text with its first standalone number swapped for `to`, or null when the text has no number. */
export function replaceFirstNumber(text: string, to: number): string | null {
  return STANDALONE_NUMBER.test(text) ? text.replace(STANDALONE_NUMBER, String(to)) : null;
}

/** "Practice 45 min a day" -> 45 (5 to 240), or null when the text does not say minutes. */
export function minutesFromText(text: string): number | null {
  const match = /(?<![\d])(\d{1,3})\s*(?:minutes?|mins?)\b/i.exec(text);
  const n = match ? Number(match[1]) : NaN;
  return n >= 5 && n <= 240 ? n : null;
}

/** The goal for an "easier win": the old minutes become the new ones inside a written goal (the API does the same); else unchanged. */
export function easierGoalText(goal: string | null, oldMinutes: number, newMinutes: number): string | null {
  if (goal === null) return null;
  return goal.replace(new RegExp(`(?<![\\d])${oldMinutes}(?![\\d])`), String(newMinutes));
}
