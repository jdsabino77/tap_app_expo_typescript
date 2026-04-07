import { describe, expect, it } from "vitest";
import { parseAuthTokensFromUrl } from "./auth-url-tokens";

describe("parseAuthTokensFromUrl", () => {
  it("reads tokens from hash fragment", () => {
    const url =
      "tap://auth/callback#access_token=at&refresh_token=rt&expires_in=3600&type=signup";
    expect(parseAuthTokensFromUrl(url)).toEqual({ access_token: "at", refresh_token: "rt" });
  });

  it("reads tokens from query when no hash", () => {
    const url = "https://example.com/cb?access_token=a&refresh_token=b";
    expect(parseAuthTokensFromUrl(url)).toEqual({ access_token: "a", refresh_token: "b" });
  });

  it("returns null when tokens missing", () => {
    expect(parseAuthTokensFromUrl("tap://x#type=signup")).toBeNull();
    expect(parseAuthTokensFromUrl("https://example.com")).toBeNull();
  });
});
