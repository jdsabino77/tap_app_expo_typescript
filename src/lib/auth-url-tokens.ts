/** Parse access + refresh tokens from a Supabase redirect URL (fragment or query). */
export function parseAuthTokensFromUrl(url: string): {
  access_token: string;
  refresh_token: string;
} | null {
  const hashIdx = url.indexOf("#");
  let paramStr = "";
  if (hashIdx >= 0) {
    paramStr = url.slice(hashIdx + 1);
  } else {
    try {
      const u = new URL(url);
      if (u.search.length > 1) {
        paramStr = u.search.slice(1);
      }
    } catch {
      /* ignore */
    }
  }
  if (!paramStr) {
    return null;
  }
  const params = new URLSearchParams(paramStr);
  const access_token = params.get("access_token") ?? "";
  const refresh_token = params.get("refresh_token") ?? "";
  if (!access_token || !refresh_token) {
    return null;
  }
  return { access_token, refresh_token };
}
