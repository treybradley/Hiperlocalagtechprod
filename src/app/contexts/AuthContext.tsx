import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, Session, User } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { apiFetch } from '../../storage/api';

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export interface UserProfile {
  id: string;
  email?: string;
  name: string;
  role: 'admin' | 'collaborator';
  farmId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Farm {
  id: string;
  name: string;
  adminId: string;
  members: Array<{ userId: string; role: string; profile?: UserProfile }>;
  createdAt: number;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  farm: Farm | null;
  loading: boolean;
  signInWithEmail: (email: string) => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (name: string) => Promise<UserProfile>;
  createFarm: (name: string) => Promise<Farm>;
  inviteMember: (email: string, role?: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.access_token).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.access_token);
        // Check for invite token in user metadata
        const inviteToken = session.user.user_metadata?.inviteToken;
        if (inviteToken) {
          try {
            await apiFetchAuth('/auth/accept-invite', session.access_token, {
              method: 'POST',
              body: JSON.stringify({ token: inviteToken }),
            });
            await loadProfile(session.access_token);
          } catch (e) {
            console.log('Error accepting invite:', e);
          }
        }
      } else {
        setProfile(null);
        setFarm(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function apiFetchAuth<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
    const base = `https://${projectId}.supabase.co/functions/v1/make-server-4f58e216`;
    const res = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (!res.ok) {
      let msg = `API error ${res.status}`;
      try { const b = await res.json(); msg = b.error ?? msg; } catch {}
      throw new Error(msg);
    }
    return res.json();
  }

  async function loadProfile(token: string) {
    try {
      const p = await apiFetchAuth<UserProfile | null>('/auth/me', token);
      setProfile(p);
      if (p?.farmId) {
        const f = await apiFetchAuth<Farm>(`/farms/${p.farmId}`, token);
        setFarm(f);
      } else {
        setFarm(null);
      }
    } catch (e) {
      console.log('Error loading profile:', e);
    }
  }

  async function signInWithEmail(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw new Error(`Sign-in error: ${error.message}`);
  }

  async function signInWithPhone(phone: string) {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw new Error(`Sign-in error: ${error.message}`);
  }

  async function verifyPhoneOtp(phone: string, token: string) {
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) throw new Error(`OTP error: ${error.message}`);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setFarm(null);
  }

  async function saveProfile(name: string): Promise<UserProfile> {
    if (!session) throw new Error('Not logged in');
    const p = await apiFetchAuth<UserProfile>('/auth/profile', session.access_token, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    setProfile(p);
    return p;
  }

  async function createFarm(name: string): Promise<Farm> {
    if (!session) throw new Error('Not logged in');
    const f = await apiFetchAuth<Farm>('/farms', session.access_token, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    setFarm(f);
    // Refresh profile to get updated farmId
    await loadProfile(session.access_token);
    return f;
  }

  async function inviteMember(email: string, role = 'collaborator') {
    if (!session || !farm) throw new Error('No farm');
    await apiFetchAuth(`/farms/${farm.id}/invite`, session.access_token, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async function removeMember(userId: string) {
    if (!session || !farm) throw new Error('No farm');
    await apiFetchAuth(`/farms/${farm.id}/members/${userId}`, session.access_token, {
      method: 'DELETE',
    });
    // Refresh farm
    const f = await apiFetchAuth<Farm>(`/farms/${farm.id}`, session.access_token);
    setFarm(f);
  }

  async function refreshProfile() {
    if (!session) return;
    await loadProfile(session.access_token);
  }

  return (
    <AuthContext.Provider value={{
      session, user, profile, farm, loading,
      signInWithEmail, signInWithPhone, verifyPhoneOtp,
      signOut, saveProfile, createFarm, inviteMember, removeMember, refreshProfile,
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
