/**
 * ───────────────────────────────────────────────
 *  Google OAuth — construcción de la URL de consent (lado cliente)
 * ───────────────────────────────────────────────
 *  El `code` vuelve a la Edge Function `google-oauth-callback` (redirect_uri).
 *  Acá solo se necesita el CLIENT_ID (público). El CLIENT_SECRET vive en
 *  Supabase secrets, jamás en el bundle.
 */

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

/** redirect_uri = la Edge Function del callback (mismo host que Supabase). */
const REDIRECT_URI = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-oauth-callback`

/** Scopes: crear/gestionar el calendario dedicado + sus eventos. */
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
]

/** ¿Está configurado el CLIENT_ID en el env del frontend? */
export const isGoogleConfigured = (): boolean => !!GOOGLE_CLIENT_ID

/** Arma la URL de consent. `state` = nonce anti-CSRF generado por el backend. */
export function buildConsentUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID ?? "",
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline", // → devuelve refresh_token
    prompt: "consent", // → fuerza refresh_token incluso en reconexiones
    include_granted_scopes: "true",
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}
