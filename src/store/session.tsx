import type { Session } from "@supabase/supabase-js";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchMedicalProfileForUser } from "../repositories/medical-profile.repository";
import { mapAuthErrorToUserMessage } from "../lib/supabase-errors";
import { clearUserLocalCache } from "../services/local/clear-user-local-cache";
import { getSupabase, isSupabaseConfigured } from "../services/supabase/client";

export type SignUpResult = { error?: string; needsEmailConfirmation?: boolean };

export type SessionContextValue = {
  /** False until first auth state is known (medical profile may still be loading). */
  initialized: boolean;
  supabaseEnabled: boolean;
  userId: string | null;
  email: string | null;
  /**
   * Supabase: null while loading gate for signed-in user; stub mode uses boolean only.
   * false → welcome (login path); true → app.
   */
  hasMedicalProfile: boolean | null;
  /**
   * Flutter `SignUpPage` → Dashboard even without medical profile (session-only).
   */
  signupDashboardBypass: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithDetails: (p: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refreshMedicalProfileGate: () => Promise<void>;
  /** Stub mode (no env) — Phase 3 dev buttons. */
  devSignInStub: (returningUser: boolean) => void;
  devSignUpStub: () => void;
  /** Stub: after medical profile “save” without Supabase. */
  completeStubMedicalOnboarding: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function loadMedicalGateWithTimeout(userId: string, ms: number): Promise<boolean> {
  return Promise.race([
    loadMedicalGate(userId),
    new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), ms);
    }),
  ]);
}

async function loadMedicalGate(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }
  try {
    const row = await fetchMedicalProfileForUser(userId);
    return row != null;
  } catch {
    return false;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [hasMedicalProfile, setHasMedicalProfile] = useState<boolean | null>(null);
  const [signupDashboardBypass, setSignupDashboardBypass] = useState(false);

  const [stubUserId, setStubUserId] = useState<string | null>(null);
  const [stubHasMedical, setStubHasMedical] = useState(false);

  const refreshMedicalProfileGate = useCallback(async () => {
    if (!isSupabaseConfigured() || !session?.user?.id) {
      return;
    }
    const ok = await loadMedicalGate(session.user.id);
    setHasMedicalProfile(ok);
  }, [session?.user?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setInitialized(true);
      return;
    }

    const supabase = getSupabase();

    void supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setInitialized(true);
        if (s?.user?.id) {
          setHasMedicalProfile(null);
          void loadMedicalGateWithTimeout(s.user.id, 12_000).then(setHasMedicalProfile);
        } else {
          setHasMedicalProfile(null);
        }
      })
      .catch(() => {
        setSession(null);
        setHasMedicalProfile(null);
        setInitialized(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user?.id) {
        setHasMedicalProfile(null);
        void loadMedicalGateWithTimeout(s.user.id, 12_000).then(setHasMedicalProfile);
      } else {
        setHasMedicalProfile(null);
        setSignupDashboardBypass(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: "Supabase is not configured." };
    }
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: mapAuthErrorToUserMessage(error) };
      }
      setSignupDashboardBypass(false);
      return {};
    } catch (e) {
      return { error: mapAuthErrorToUserMessage(e) };
    }
  }, []);

  const signUpWithDetails = useCallback(
    async (p: { firstName: string; lastName: string; email: string; password: string }) => {
      if (!isSupabaseConfigured()) {
        return { error: "Supabase is not configured." };
      }
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.signUp({
          email: p.email.trim(),
          password: p.password,
          options: {
            data: {
              first_name: p.firstName.trim(),
              last_name: p.lastName.trim(),
            },
          },
        });
        if (error) {
          return { error: mapAuthErrorToUserMessage(error) };
        }
        if (data.session) {
          setSignupDashboardBypass(true);
          setHasMedicalProfile(false);
          return { needsEmailConfirmation: false };
        }
        return { needsEmailConfirmation: true };
      } catch (e) {
        return { error: mapAuthErrorToUserMessage(e) };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    setSignupDashboardBypass(false);
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (uid) {
        await clearUserLocalCache(uid);
      }
      await supabase.auth.signOut();
    }
    setStubUserId(null);
    setStubHasMedical(false);
  }, []);

  const devSignInStub = useCallback((returningUser: boolean) => {
    setStubUserId("stub-user");
    setStubHasMedical(returningUser);
    setSignupDashboardBypass(false);
  }, []);

  const devSignUpStub = useCallback(() => {
    setStubUserId("stub-user");
    setStubHasMedical(true);
    setSignupDashboardBypass(true);
  }, []);

  const completeStubMedicalOnboarding = useCallback(() => {
    if (!isSupabaseConfigured()) {
      setStubHasMedical(true);
    }
  }, []);

  const value = useMemo((): SessionContextValue => {
    if (!isSupabaseConfigured()) {
      return {
        initialized,
        supabaseEnabled: false,
        userId: stubUserId,
        email: null,
        hasMedicalProfile: stubHasMedical,
        signupDashboardBypass: false,
        signInWithPassword: async () => ({ error: "Supabase is not configured." }),
        signUpWithDetails: async () => ({ error: "Supabase is not configured." }),
        signOut,
        refreshMedicalProfileGate: async () => {},
        devSignInStub,
        devSignUpStub,
        completeStubMedicalOnboarding,
      };
    }

    return {
      initialized,
      supabaseEnabled: true,
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? null,
      hasMedicalProfile,
      signupDashboardBypass,
      signInWithPassword,
      signUpWithDetails,
      signOut,
      refreshMedicalProfileGate,
      devSignInStub,
      devSignUpStub,
      completeStubMedicalOnboarding,
    };
  }, [
    initialized,
    session?.user?.id,
    session?.user?.email,
    hasMedicalProfile,
    signupDashboardBypass,
    signInWithPassword,
    signUpWithDetails,
    signOut,
    refreshMedicalProfileGate,
    stubUserId,
    stubHasMedical,
    devSignInStub,
    devSignUpStub,
    completeStubMedicalOnboarding,
  ]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
