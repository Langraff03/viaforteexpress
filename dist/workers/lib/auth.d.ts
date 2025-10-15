import type { User } from '../types';
export type { User };
interface AuthState {
    user: User | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    signOut: () => Promise<void>;
}
export declare const useAuthStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AuthState>>;
export declare function useAuth(): {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isGatewayUser: boolean;
    isFreelancer: boolean;
    clientId: string | null | undefined;
    gatewayId: string | null | undefined;
};
