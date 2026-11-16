/** Sample data for the onboarding screens (Phase 2). Phase 3 moves this behind the DataSource interface. */

export interface Hobby {
  id: string;
  label: string;
  /** Used in the invite text: "I'm {phrase} 20 min a day this week." */
  phrase: string;
  emoji: string;
}

export const HOBBIES: Hobby[] = [
  { id: 'guitar', label: 'Guitar', phrase: 'practicing guitar', emoji: '🎸' },
  { id: 'running', label: 'Running', phrase: 'running', emoji: '🏃' },
  { id: 'spanish', label: 'Spanish', phrase: 'studying Spanish', emoji: '🗣️' },
  { id: 'gym', label: 'Gym', phrase: 'hitting the gym', emoji: '🏋️' },
  { id: 'reading', label: 'Reading', phrase: 'reading', emoji: '📚' },
  { id: 'drawing', label: 'Drawing', phrase: 'drawing', emoji: '🎨' },
  { id: 'cooking', label: 'Cooking', phrase: 'cooking', emoji: '🍳' },
  { id: 'coding', label: 'Coding', phrase: 'coding', emoji: '💻' },
  { id: 'meditation', label: 'Meditation', phrase: 'meditating', emoji: '🧘' },
];

export interface Contact {
  id: string;
  name: string;
  subtitle: string;
  tone: 'you' | 'opponent' | 'neutral';
}

/** Eleanor and Tanish become seeded real accounts in Phase 4; Ben is a plain contact. */
export const CONTACTS: Contact[] = [
  { id: 'eleanor', name: 'Eleanor', subtitle: 'In your contacts · not on Dual yet', tone: 'opponent' },
  { id: 'tanish', name: 'Tanish', subtitle: 'On Dual · runs 3× a week', tone: 'you' },
  { id: 'ben', name: 'Ben', subtitle: 'In your contacts', tone: 'neutral' },
];

/** Starter goal choices the pencil on the Hobby screen cycles through. */
export const MINUTE_OPTIONS = [10, 15, 20, 30, 45];

export const DEMO_USER_NAME = 'Ari';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L

export function makeInviteCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return code;
}
