import { NextResponse } from "next/server";

const BROWSER_MAX_AGE_SECONDS = 60;

export const CACHE_TTL = {
  short: 300,
  medium: 900,
  long: 1800,
  xl: 3600,
  day: 86400,
} as const;

export const jsonWithCache = (payload: unknown, cacheSeconds: number) => {
  const staleSeconds = Math.max(cacheSeconds * 2, 120);

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": `public, max-age=${BROWSER_MAX_AGE_SECONDS}, s-maxage=${cacheSeconds}, stale-while-revalidate=${staleSeconds}`,
    },
  });
};
