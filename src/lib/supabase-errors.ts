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
      return "An account already exists for that email.";
    case "weak-password":
      return "The password is too weak.";
    case "invalid-email":
      return "The email address is not valid.";
    case "user-disabled":
      return "This account has been disabled.";
    case "too-many-requests":
      return "Too many attempts. Try again later.";
    case "operation-not-allowed":
      return "This sign-in method is not enabled.";
    default:
      break;
  }

  if (e.message && typeof e.message === "string") {
    return e.message;
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
