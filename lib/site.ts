/** Canonical site origin. Configure with NEXT_PUBLIC_SITE_URL in production; falls back to localhost for development. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "FinSight";
export const TAGLINE = "See Your Money Clearly.";
