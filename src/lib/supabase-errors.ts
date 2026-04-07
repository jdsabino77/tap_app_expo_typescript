/**
 * Map Supabase / PostgREST errors to short user-facing strings.
 * Aligns with Flutter `AuthService._handleAuthException` where codes overlap.
 */

export type AuthErrorLike = {
  message?: string;
  name?: string;
  status?: number;
  code?: string;
};

export type PostgrestErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function mapAuthErrorToUserMessage(error: unknown): string {
  if (error == null) {
    return "Something went wrong. Please try again.";
  }

  if (typeof error === "string") {
    return error;
  }

  const e = error as AuthErrorLike;
  const code = (e.code ?? e.name ?? "").toString().toLowerCase().replace(/_/g, "-");

  switch (code) {
    case "user-not-found":
      return "No user found for that email.";
    case "wrong-password":
    case "invalid-credentials":
      return "Wrong password provided.";
    case "email-already-in-use":
    case "user-already-exists":
    case "email-exists":
      return "An account already exists for that email.";
    case "weak-password":
      return "The password is too weak.";
    case "invalid-email":
    case "email-address-invalid":
      return "The email address is not valid.";
    case "user-disabled":
    case "user-banned":
      return "This account has been disabled.";
    case "too-many-requests":
    case "over-request-rate-limit":
      return "Too many attempts. Try again later.";
    case "over-email-send-rate-limit":
      return "Too many emails sent. Wait a few minutes and try again.";
    case "operation-not-allowed":
    case "signup-disabled":
      return "New sign-ups are turned off in this Supabase project. In the dashboard: Authentication → Providers → Email → enable “Allow new users to sign up”.";
    case "email-provider-disabled":
    case "provider-disabled":
      return "Email sign-in is disabled in this Supabase project. Enable the Email provider under Authentication → Providers.";
    case "email-address-not-authorized":
      return "This email is not allowed to register (your project may restrict which addresses can sign up).";
    case "email-not-confirmed":
      return "Confirm your email address before signing in.";
    default:
      break;
  }

  if (e.message && typeof e.message === "string") {
    const m = e.message;
    const lower = m.toLowerCase();
    if (lower.includes("database error") || lower.includes("saving new user")) {
      return "The account could not be finished in the database. Your Supabase project needs the Phase 5 SQL (especially `profiles` + `handle_new_user` trigger). Run `001_phase5_core.sql` from this repo, then try again.";
    }
    if (
      lower.includes("signup") &&
      (lower.includes("disabled") || lower.includes("not allowed"))
    ) {
      return "New sign-ups are disabled. In Supabase: Authentication → Providers → Email → allow new users to sign up.";
    }
    return m;
  }

  return "An authentication error occurred. Please try again.";
}

export function mapPostgrestErrorToUserMessage(error: unknown): string {
  if (error == null) {
    return "Could not load data. Please try again.";
  }

  if (typeof error === "string") {
    return error;
  }

  const e = error as PostgrestErrorLike;
  const code = (e.code ?? "").toUpperCase();

  if (code === "PGRST116" || code === "42501") {
    return "You do not have access to this data.";
  }

  if (e.message) {
    return e.message;
  }

  return "Something went wrong while saving. Please try again.";
}

export function mapUnknownErrorToUserMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return fallback;
}
