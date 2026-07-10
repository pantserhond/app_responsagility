/**
 * Checks if a URL is a Supabase auth callback (contains access_token in fragment).
 */
export function isAuthCallbackUrl(url: string): boolean {
  return url.includes('auth/callback') && url.includes('access_token')
}

/**
 * Extracts auth tokens from a Supabase redirect URL fragment.
 * Supabase appends tokens as a hash fragment: #access_token=...&refresh_token=...&type=...
 */
export function parseAuthCallback(url: string): {
  access_token: string | null
  refresh_token: string | null
  type: string | null
} {
  const hashIndex = url.indexOf('#')
  if (hashIndex === -1) {
    return { access_token: null, refresh_token: null, type: null }
  }

  const fragment = url.substring(hashIndex + 1)
  const params = new URLSearchParams(fragment)

  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
    type: params.get('type'),
  }
}
