import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ApprovalStatus = 'pending' | 'preapproved' | 'approved';
export type AppRole = 'superadmin' | 'administracion' | 'supervisor' | 'acreditador';

export interface Profile {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string;
  referencia_contacto: string | null;
  foto_url: string | null;
  approval_status: ApprovalStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  isApproved: boolean;
  isActive: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isAdmin: boolean;
}

interface SignUpData {
  email: string;
  password: string;
  rut: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  referencia_contacto?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data as Profile | null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  const fetchRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;
      setRoles((data?.map(r => r.role) || []) as AppRole[]);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
    }
  };

  const refreshProfile = async () => {
    // If user is already in state, use it
    if (user) {
      await Promise.all([fetchProfile(user.id), fetchRoles(user.id)]);
      return;
    }
    
    // If user is not in state yet, try to get it from Supabase session
    // This handles race conditions during initial hydration
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setSession(session);
        await Promise.all([fetchProfile(session.user.id), fetchRoles(session.user.id)]);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadUserData = async (userId: string) => {
      await Promise.all([fetchProfile(userId), fetchRoles(userId)]);
    };

    // Listener para cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await loadUserData(newSession.user.id);
        } else {
          setProfile(null);
          setRoles([]);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setRoles([]);
        }

        if (isMounted) setIsLoading(false);
      }
    );

    // Carga inicial
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await loadUserData(initialSession.user.id);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Crear perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            rut: data.rut,
            nombre: data.nombre,
            apellido: data.apellido,
            email: data.email,
            telefono: data.telefono || null,
            referencia_contacto: data.referencia_contacto || null,
          });

        if (profileError) throw profileError;
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  const isAdmin = hasRole('superadmin') || hasRole('administracion');
  const isApproved = profile?.approval_status === 'approved';
  const isActive = profile?.is_active ?? false;

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        roles,
        isLoading,
        isApproved,
        isActive,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
        hasRole,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useUserRoles() {
  const { roles } = useAuth();
  return roles;
}

export function useHasRole(role: AppRole) {
  const { hasRole } = useAuth();
  return hasRole(role);
}

export function getDefaultDashboard(roles: AppRole[]): string {
  if (roles.includes('superadmin')) return '/app/dashboard/superadmin';
  if (roles.includes('administracion')) return '/app/dashboard/admin';
  if (roles.includes('supervisor')) return '/app/dashboard/supervisor';
  if (roles.includes('acreditador')) return '/app/dashboard/acreditador';
  return '/app/dashboard';
}
