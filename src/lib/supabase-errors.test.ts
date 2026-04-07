import { describe, expect, it } from "vitest";
import { mapAuthErrorToUserMessage, mapPostgrestErrorToUserMessage } from "./supabase-errors";

describe("mapAuthErrorToUserMessage", () => {
  it("maps known codes", () => {
    expect(mapAuthErrorToUserMessage({ code: "invalid-email" })).toContain("email");
    expect(mapAuthErrorToUserMessage({ code: "user-not-found" })).toContain("No user");
  });

  it("falls back to message", () => {
    expect(mapAuthErrorToUserMessage({ message: "Custom" })).toBe("Custom");
  });

  it("maps Supabase Auth error codes for sign-up", () => {
    expect(mapAuthErrorToUserMessage({ code: "signup_disabled" })).toContain("sign");
    expect(mapAuthErrorToUserMessage({ code: "user_already_exists" })).toContain("already exists");
    expect(
      mapAuthErrorToUserMessage({ message: "Database error saving new user" }),
    ).toContain("Phase 5");
  });
});

describe("mapPostgrestErrorToUserMessage", () => {
  it("maps RLS-ish codes", () => {
    expect(mapPostgrestErrorToUserMessage({ code: "42501" })).toContain("access");
  });
});
