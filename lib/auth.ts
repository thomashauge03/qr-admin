export const ADMIN_EMAIL = 'thomashauge03@gmail.com'

export function isAdmin(email: string | undefined): boolean {
  return email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

// Alle innloggede brukere er potensielt tillatt — status sjekkes mot profiles-tabellen
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isAllowed(_email: string | undefined): boolean {
  return true
}
