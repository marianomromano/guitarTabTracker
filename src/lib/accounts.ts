export function parseEmail(value: FormDataEntryValue | null) {
  const email = String(value ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function parsePassword(value: FormDataEntryValue | null) {
  const password = String(value ?? "");
  return password.length >= 8 ? password : null;
}
