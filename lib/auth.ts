// Kun disse e-postadressene har tilgang til appen
export const ALLOWED_EMAILS = [
  'thomashauge03@gmail.com',
]

export function isAllowed(email: string | undefined): boolean {
  if (!email) return false
  return ALLOWED_EMAILS.includes(email.toLowerCase())
}
