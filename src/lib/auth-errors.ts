export const AUTH_ERRORS = {
  invalid: "Enter a valid email and a password of at least 8 characters.",
  unconfirmed: "Confirm your email before signing in.",
  signup: "Could not create an account. Try again or sign in if you already registered.",
  confirmation: "That confirmation link is invalid or expired. Request a new confirmation email.",
  wrong: "Wrong email or password.",
  missing: "No account for that email yet. Create one below.",
  exists: "That email already has an account. Sign in instead.",
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERRORS;

export function authErrorMessage(code: string | undefined) {
  if (!code || !(code in AUTH_ERRORS)) return null;
  return AUTH_ERRORS[code as AuthErrorCode];
}
