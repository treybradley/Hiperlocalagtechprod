import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  showAuthModal: boolean;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  openAuthModal: (onSuccess?: () => void) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export { supabase };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session && pendingActionRef.current) {
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        setShowAuthModal(false);
        action();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithEmail(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw new Error(`Sign-in error: ${error.message}`);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  function openAuthModal(onSuccess?: () => void) {
    pendingActionRef.current = onSuccess ?? null;
    setShowAuthModal(true);
  }

  function closeAuthModal() {
    pendingActionRef.current = null;
    setShowAuthModal(false);
  }

  return (
    <AuthContext.Provider value={{
      session, user, loading, showAuthModal,
      signInWithEmail, signOut, openAuthModal, closeAuthModal,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
