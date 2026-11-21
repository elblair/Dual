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

/** A group of hobbies ("Languages"). The Hobby step shows categories first and opens one to pick the specific hobby. */
export interface Category {
  id: string;
  label: string;
  hobbies: Hobby[];
}

const hobby = (id: string, label: string, action: string, phrase: string, emoji: string): Hobby => ({ id, label, action, phrase, emoji });

/**
 * The fixed catalog (not user data). Hobby ids are stored on duels, so an id is never renamed or removed: the nine original
 * ids (guitar, running, spanish, gym, reading, drawing, cooking, coding, meditation) are kept as they were.
 */
export const CATEGORIES: Category[] = [
  {
    id: 'music',
    label: 'Music',
    hobbies: [
      hobby('guitar', 'Guitar', 'Practice guitar', 'practicing guitar', '🎸'),
      hobby('piano', 'Piano', 'Practice piano', 'practicing piano', '🎹'),
      hobby('singing', 'Singing', 'Sing', 'singing', '🎤'),
      hobby('drums', 'Drums', 'Practice drums', 'practicing drums', '🥁'),
    ],
  },
  {
    id: 'fitness',
    label: 'Fitness',
    hobbies: [
      hobby('running', 'Running', 'Go for a run', 'running', '🏃'),
      hobby('gym', 'Gym', 'Hit the gym', 'hitting the gym', '🏋️'),
      hobby('yoga', 'Yoga', 'Do yoga', 'doing yoga', '🤸'),
      hobby('cycling', 'Cycling', 'Go for a ride', 'cycling', '🚴'),
      hobby('swimming', 'Swimming', 'Go for a swim', 'swimming', '🏊'),
    ],
  },
  {
    id: 'languages',
    label: 'Languages',
    hobbies: [
      hobby('spanish', 'Spanish', 'Study Spanish', 'studying Spanish', '🗣️'),
      hobby('french', 'French', 'Study French', 'studying French', '🥐'),
      hobby('japanese', 'Japanese', 'Study Japanese', 'studying Japanese', '🎌'),
      hobby('mandarin', 'Mandarin', 'Study Mandarin', 'studying Mandarin', '🀄'),
      hobby('german', 'German', 'Study German', 'studying German', '🥨'),
    ],
  },
  {
    id: 'creative',
    label: 'Creative',
    hobbies: [
      hobby('drawing', 'Drawing', 'Draw', 'drawing', '🎨'),
      hobby('writing', 'Writing', 'Write', 'writing', '✍️'),
      hobby('photography', 'Photography', 'Shoot photos', 'taking photos', '📷'),
      hobby('crafts', 'Crafts', 'Make crafts', 'making crafts', '✂️'),
    ],
  },
  {
    id: 'learning',
    label: 'Learning',
    hobbies: [
      hobby('reading', 'Reading', 'Read', 'reading', '📚'),
      hobby('coding', 'Coding', 'Code', 'coding', '💻'),
      hobby('studying', 'Studying', 'Study', 'studying', '🎓'),
    ],
  },
  {
    id: 'wellness',
    label: 'Wellness',
    hobbies: [
      hobby('meditation', 'Meditation', 'Meditate', 'meditating', '🧘'),
      hobby('journaling', 'Journaling', 'Journal', 'journaling', '📓'),
      hobby('stretching', 'Stretching', 'Stretch', 'stretching', '🙆'),
    ],
  },
  {
    id: 'food',
    label: 'Food',
    hobbies: [hobby('cooking', 'Cooking', 'Cook', 'cooking', '🍳'), hobby('baking', 'Baking', 'Bake', 'baking', '🧁')],
  },
];

export const HOBBIES: Hobby[] = CATEGORIES.flatMap((c) => c.hobbies);

/** What is selected before anyone picks (and what an unknown id falls back to). */
export const DEFAULT_HOBBY_ID = 'guitar';

export function hobbyById(id: string): Hobby {
  return HOBBIES.find((h) => h.id === id) ?? HOBBIES.find((h) => h.id === DEFAULT_HOBBY_ID)!;
}

/** The category a hobby belongs to. */
export function categoryOf(hobbyId: string): Category | undefined {
  return CATEGORIES.find((c) => c.hobbies.some((h) => h.id === hobbyId));
}

/**
 * Search across both levels. A word that matches a category name ("lang") returns the whole category; otherwise only the
 * hobbies whose name matches. Categories with no match are left out. An empty search returns nothing.
 */
export function searchCatalog(query: string): { category: Category; hobbies: Hobby[] }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: { category: Category; hobbies: Hobby[] }[] = [];
  for (const category of CATEGORIES) {
    const hobbies = category.label.toLowerCase().includes(q) ? category.hobbies : category.hobbies.filter((h) => h.label.toLowerCase().includes(q));
    if (hobbies.length > 0) results.push({ category, hobbies });
  }
  return results;
}

/** Starter goal choices the pencil on the Hobby screen cycles through. */
export const MINUTE_OPTIONS = [10, 15, 20, 30, 45];

/** The lighter goal offered after a duel: half the minutes, rounded down to 5, never below 5 (same rule as the API). */
export function easierMinutes(minutes: number): number {
  return Math.max(5, Math.floor(Math.floor(minutes / 2) / 5) * 5);
}

/** A written goal is trimmed and at most this many characters (the API enforces the same rule). */
export const GOAL_MAX = 60;

/** The profile bio is at most this many characters, and a profile has at most this many interests (the API enforces both). */
export const BIO_MAX = 160;
export const INTERESTS_MAX = 12;

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
