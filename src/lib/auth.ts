import { create } from 'zustand';
import { supabase } from './supabaseClient';
import type { User } from '../types';

// Re-exporta o tipo para ser consumido de um único local
export type { User };

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true, // Começa como true até que o AuthProvider defina o estado
  setUser: (user) => {
    set({ user, loading: false });
  },
  setLoading: (loading) => {
    set({ loading });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, loading: false });
  },
}));

// Hook de conveniência para acessar o estado e ações
export function useAuth() {
  const { 
    user, 
    loading, 
    signOut: signOutAction 
  } = useAuthStore();

  const isAdmin = user?.role === 'admin';
  const isGatewayUser = user?.role === 'gateway_user';
  const isFreelancer = user?.role === 'freelancer';
  
  const signOut = async () => {
    await signOutAction();
  };

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
    isAdmin,
    isGatewayUser,
    isFreelancer,
    clientId: user?.client_id,
    gatewayId: user?.gateway_id,
  };
}
