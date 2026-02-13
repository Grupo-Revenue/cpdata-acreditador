import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ApprovalStatus = 'pending' | 'rejected' | 'approved';
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
  activeRole: AppRole | null;
  setActiveRole: (role: AppRole | null) => void;
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
  const VALID_ROLES: AppRole[] = ['superadmin', 'administracion', 'supervisor', 'acreditador'];

  const getStoredRole = (): AppRole | null => {
    try {
      const stored = localStorage.getItem('activeRole');
      if (stored && VALID_ROLES.includes(stored as AppRole)) {
        return stored as AppRole;
      }
    } catch {}
    return null;
  };

  const [activeRole, _setActiveRole] = useState<AppRole | null>(getStoredRole);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const handleSetActiveRole = (role: AppRole | null) => {
    _setActiveRole(role);
    try {
      if (role) {
        localStorage.setItem('activeRole', role);
      } else {
        localStorage.removeItem('activeRole');
      }
    } catch {}
  };

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
      const fetchedRoles = (data?.map(r => r.role) || []) as AppRole[];
      setRoles(fetchedRoles);

      // Validate stored activeRole against fetched roles
      const stored = getStoredRole();
      if (stored && !fetchedRoles.includes(stored)) {
        handleSetActiveRole(null);
      }
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

    // Configurar listener PRIMERO (recomendación de Supabase)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMounted) return;

        // Actualizar estado de sesión de forma síncrona
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setRoles([]);
          setIsLoading(false);
          return;
        }

        // Para otros eventos, cargar datos en setTimeout para evitar deadlock
        if (newSession?.user) {
          setTimeout(async () => {
            if (!isMounted) return;
            await loadUserData(newSession.user.id);
            if (isMounted) setIsLoading(false);
          }, 0);
        } else {
          // No hay usuario - ya podemos dejar de cargar
          setProfile(null);
          setRoles([]);
          setIsLoading(false);
        }
      }
    );

    // Luego hacer la carga inicial
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        // Si no hay sesión, marcar como no loading inmediatamente
        if (!initialSession?.user) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setRoles([]);
          setIsLoading(false);
          return;
        }

        // Si hay sesión, el onAuthStateChange ya la manejará
        // pero por seguridad también la procesamos aquí
        setSession(initialSession);
        setUser(initialSession.user);
        await loadUserData(initialSession.user.id);
      } catch (error) {
        console.error('Error initializing auth:', error);
        // En caso de error, igual dejar de cargar para no quedar atascados
        setProfile(null);
        setRoles([]);
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
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            rut: data.rut,
            nombre: data.nombre,
            apellido: data.apellido,
            telefono: data.telefono || null,
            referencia_contacto: data.referencia_contacto || null,
          },
        },
      });

      if (error) throw error;
      // El perfil se crea automáticamente por el trigger en la base de datos
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    handleSetActiveRole(null);
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

  const isAdmin = activeRole === 'superadmin' || activeRole === 'administracion';
  const isApproved = profile?.approval_status === 'approved';
  const isActive = profile?.is_active ?? false;

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        roles,
        activeRole,
        setActiveRole: handleSetActiveRole,
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

export function getDashboardForRole(role: AppRole): string {
  switch (role) {
    case 'superadmin': return '/app/dashboard/superadmin';
    case 'administracion': return '/app/dashboard/admin';
    case 'supervisor': return '/app/dashboard/supervisor';
    case 'acreditador': return '/app/dashboard/acreditador';
    default: return '/app/dashboard';
  }
}
