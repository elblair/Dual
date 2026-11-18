/** Same minimum as the API (RegisterIn.password). */
export const PASSWORD_MIN = 6;

export type StrengthLevel = 'tooShort' | 'weak' | 'good' | 'strong';

export interface Strength {
  level: StrengthLevel;
  /** 0 to 4 filled segments. */
  segments: number;
  label: string;
  /** What would make it stronger, or null when it is already strong. */
  hint: string | null;
}

/** A simple, explainable score: 6+ characters is the minimum, then one point each for 10+ characters, upper and lower case, a number, a symbol. */
export function passwordStrength(password: string): Strength {
  if (password.length < PASSWORD_MIN) {
    const left = PASSWORD_MIN - password.length;
    return { level: 'tooShort', segments: 0, label: 'Too short', hint: `${left} more character${left === 1 ? '' : 's'} to go` };
  }
  const extras = [
    password.length >= 10,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = Math.min(4, 1 + extras.filter(Boolean).length);
  const missing = !extras[2] ? 'a number' : !extras[3] ? 'a symbol' : !extras[1] ? 'a capital letter' : 'a few more characters';
  if (score >= 4) return { level: 'strong', segments: 4, label: 'Strong', hint: null };
  if (score >= 2) return { level: 'good', segments: score, label: 'Good', hint: `Add ${missing} to make it strong` };
  return { level: 'weak', segments: 1, label: 'Weak', hint: `Add ${missing} to make it stronger` };
}
