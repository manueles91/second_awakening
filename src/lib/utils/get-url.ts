/**
 * Returns the base URL for the site.
 * Uses NEXT_PUBLIC_SITE_URL env var first, then VERCEL_URL, then falls back to localhost.
 */
export function getSiteUrl(): string {
  // Explicit site URL (set in Vercel env vars)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Vercel auto-sets this on deployments
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // Fallback for local dev
  return "http://localhost:3000";
}
