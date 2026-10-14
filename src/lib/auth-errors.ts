export const AUTH_ERRORS = {
  invalid: "Enter a valid email and a password of at least 8 characters.",
  wrong: "Wrong email or password.",
  missing: "No account for that email yet. Create one below.",
  exists: "That email already has an account. Sign in instead.",
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERRORS;

export function authErrorMessage(code: string | undefined) {
  if (!code || !(code in AUTH_ERRORS)) return null;
  return AUTH_ERRORS[code as AuthErrorCode];
}
