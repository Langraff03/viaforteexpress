import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../lib/auth';
import { User } from '../types';

export const AuthContext = createContext({});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, user, loading } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    // Previne re-execução em StrictMode ou HMR
    if (initialized.current) {
      return;
    }
    initialized.current = true;
    
    console.log('🔵 DEBUG AuthProvider: Inicializando...');
    setLoading(true);

    const handleUserSession = async (session: Session | null) => {
      console.log('🔍 DEBUG AuthProvider: handleUserSession chamado com sessão:', !!session);
      try {
        if (!session?.user) {
          console.log("⚪ DEBUG AuthProvider: Nenhuma sessão encontrada. Usuário deslogado.");
          setUser(null);
          return;
        }

        console.log(`AuthProvider V5: Etapa 1 - Buscando perfil para ${session.user.id}`);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
        if (!profile) throw new Error(`Perfil não encontrado para o usuário ${session.user.id}.`);
        
        console.log("AuthProvider V5: Perfil base encontrado.");

        let clientName: string | null = null;
        if (profile.client_id) {
          const { data: client, error: clientError } = await supabase
            .from('clients').select('name').eq('id', profile.client_id).single();
          if (clientError) console.warn(`Aviso ao buscar cliente: ${clientError.message}`);
          else clientName = client?.name || null;
        }
        
        let gatewayType: string | null = null;
        if (profile.gateway_id) {
           const { data: gateway, error: gatewayError } = await supabase
            .from('gateways').select('type').eq('id', profile.gateway_id).single();
           if (gatewayError) console.warn(`Aviso ao buscar gateway: ${gatewayError.message}`);
           else gatewayType = gateway?.type || null;
        }
const userData: User = {
    id: profile.id,
    email: session.user.email ?? '',
    name: profile.full_name,
    role: profile.role,
    client_id: profile.client_id,
    gateway_id: profile.gateway_id,
    clientName,
    gatewayType,
};

console.log("🔵 DEBUG AuthProvider: Usuário final montado:", {
  email: userData.email,
  role: userData.role,
  client_id: userData.client_id,
  gateway_id: userData.gateway_id
});
console.log(`🎯 DEBUG AuthProvider: Role do usuário é: ${userData.role}`);
        setUser(userData);
        setLoading(false); // Só define loading=false APÓS o userData completo estar pronto
        
      } catch (error: any) {
        console.error("AuthProvider V5: Exceção no handleUserSession. Deslogando.", error.message);
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false); // Define loading=false mesmo em caso de erro
      }
    };
    
    // IMPORTANTE: loading começa como true e só muda para false após carregar dados
    console.log('🚨 DEBUG AuthProvider: Iniciando verificação de sessão...');
    
    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('📦 DEBUG AuthProvider: Sessão inicial:', {
        hasSession: !!session,
        hasError: !!error,
        userId: session?.user?.id
      });
      
      if (!error && session) {
        // Se há sessão, handleUserSession vai definir loading=false após carregar perfil
        handleUserSession(session);
      } else {
        // Se não há sessão ou há erro, define loading=false imediatamente
        console.log('❌ DEBUG AuthProvider: Sem sessão inicial ou erro:', error?.message);
        setLoading(false);
      }
    });
    
    // Simplificando o listener para tratar todos os eventos relevantes que trazem uma sessão.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🎯 DEBUG AuthProvider: Evento de auth recebido - ${event}`);
      console.log('📊 DEBUG AuthProvider: Detalhes do evento:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });
      
      // Só processar se for um evento relevante
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        handleUserSession(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      initialized.current = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
