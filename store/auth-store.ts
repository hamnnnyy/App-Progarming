import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import User from '@type/User';
import { signup, login, SignupPayload, LoginPayload } from '@/api/auth';

const KEYS = {
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
} as const;

async function saveTokens(accessToken: string, refreshToken: string) {
    await Promise.all([
        SecureStore.setItemAsync(KEYS.accessToken, accessToken),
        SecureStore.setItemAsync(KEYS.refreshToken, refreshToken),
    ]);
}

async function deleteTokens() {
    await Promise.all([
        SecureStore.deleteItemAsync(KEYS.accessToken),
        SecureStore.deleteItemAsync(KEYS.refreshToken),
    ]);
}

type AuthStatus = 'checking' | 'authenticated' | 'guest';

interface AuthState {
    status: AuthStatus;
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    loading: boolean;
    error: string | null;

    restoreSession: () => Promise<void>;
    signUp: (payload: SignupPayload) => Promise<void>;
    logIn: (payload: LoginPayload) => Promise<void>;
    logOut: () => Promise<void>;
    setTokens: (accessToken: string, refreshToken: string) => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
    status: 'checking',
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: false,
    error: null,

    restoreSession: async () => {
        const [accessToken, refreshToken] = await Promise.all([
            SecureStore.getItemAsync(KEYS.accessToken),
            SecureStore.getItemAsync(KEYS.refreshToken),
        ]);
        if (accessToken && refreshToken) {
            set({ accessToken, refreshToken, status: 'authenticated' });
        } else {
            set({ status: 'guest' });
        }
    },

    signUp: async payload => {
        set({ loading: true, error: null });
        try {
            const res = await signup(payload);
            await saveTokens(res.accessToken, res.refreshToken);
            set({
                status: 'authenticated',
                user: res.user,
                accessToken: res.accessToken,
                refreshToken: res.refreshToken,
                loading: false,
            });
        } catch (err: unknown) {
            const serverRes = (
                err as { response?: { data?: { message?: string } } }
            ).response;
            const message = serverRes
                ? (serverRes.data?.message ?? '회원가입에 실패했습니다.')
                : '서버와 통신 중 오류가 발생했습니다.';
            set({ error: message, loading: false });
            throw err;
        }
    },

    logIn: async payload => {
        set({ loading: true, error: null });
        try {
            const res = await login(payload);
            await saveTokens(res.accessToken, res.refreshToken);
            set({
                status: 'authenticated',
                user: res.user,
                accessToken: res.accessToken,
                refreshToken: res.refreshToken,
                loading: false,
            });
        } catch (err: unknown) {
            const serverRes = (
                err as { response?: { data?: { message?: string } } }
            ).response;
            const message = serverRes
                ? (serverRes.data?.message ?? '로그인에 실패했습니다.')
                : '서버와 통신 중 오류가 발생했습니다.';
            set({ error: message, loading: false });
            throw err;
        }
    },

    logOut: async () => {
        await deleteTokens();
        set({
            status: 'guest',
            user: null,
            accessToken: null,
            refreshToken: null,
            error: null,
        });
    },

    setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken, status: 'authenticated' });
    },

    clearError: () => set({ error: null }),
}));
