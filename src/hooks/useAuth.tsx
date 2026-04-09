import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name: string;
  username: string;
  role: "admin" | "manager" | "cashier" | "client";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdminOrManager: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: "admin" | "manager" | "cashier" | "client") => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Demo accounts for offline/preview mode
const DEMO_ACCOUNTS: Record<string, { password: string; profile: Profile }> = {
  "admin@swift-mart.com": {
    password: "admin123",
    profile: { id: "demo-admin-id", full_name: "Admin Swift-Mart", username: "admin", role: "admin" },
  },
  "manager@swift-mart.com": {
    password: "manager123",
    profile: { id: "demo-manager-id", full_name: "Manager Swift-Mart", username: "manager", role: "manager" },
  },
  "client@swift-mart.com": {
    password: "client123",
    profile: { id: "demo-client-id", full_name: "Client Swift-Mart", username: "client", role: "client" },
  },
};

function isDemoMode(): boolean {
  try {
    const hostname = window.location.hostname.toLowerCase();
    return (
      hostname.includes("preview") ||
      hostname.includes("lovable.app") ||
      hostname.includes("lovableproject.com") ||
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (data) {
      setProfile({
        id: data.id,
        full_name: data.full_name,
        username: data.username,
        role: data.role,
      });
    }
  }, []);

  // Restore demo session from localStorage on mount
  useEffect(() => {
    const demoMode = isDemoMode();

    if (demoMode) {
      const storedEmail = localStorage.getItem("swift-mart-demo-email");
      if (storedEmail && DEMO_ACCOUNTS[storedEmail]) {
        const demo = DEMO_ACCOUNTS[storedEmail];
        setUser({ id: demo.profile.id, email: storedEmail } as User);
        setSession({ user: { id: demo.profile.id, email: storedEmail } } as Session);
        setProfile(demo.profile);
      }
      setIsLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    // Demo mode: validate locally, no network call
    if (isDemoMode()) {
      const demo = DEMO_ACCOUNTS[email.toLowerCase().trim()];
      if (!demo) return { error: "Compte non trouvé" };
      if (demo.password !== password) return { error: "Mot de passe incorrect" };
      
      localStorage.setItem("swift-mart-demo-email", email.toLowerCase().trim());
      setUser({ id: demo.profile.id, email } as User);
      setSession({ user: { id: demo.profile.id, email } } as Session);
      setProfile(demo.profile);
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, role: "admin" | "manager" | "cashier" | "client") => {
    if (isDemoMode()) {
      return { error: "L'inscription n'est pas disponible en mode démo" };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (isDemoMode()) {
      localStorage.removeItem("swift-mart-demo-email");
      setUser(null);
      setSession(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const isAuthenticated = !!session && !!user;
  const isAdminOrManager = profile?.role === "admin" || profile?.role === "manager";

  return (
    <AuthContext.Provider
      value={{ user, session, profile, isLoading, isAuthenticated, isAdminOrManager, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
