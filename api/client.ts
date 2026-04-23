import axios, { InternalAxiosRequestConfig } from 'axios';

const BASE_URL = 'https://bssm-api.zer0base.me';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor — 모든 요청 전에 실행, 토큰 주입
apiClient.interceptors.request.use(
    config => {
        // auth-store를 직접 import하면 순환 참조가 생기므로 동적으로 참조
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useAuthStore } = require('@/store/auth-store');
        const token: string | null = useAuthStore.getState().accessToken;
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    error => Promise.reject(error),
);

// ── Refresh Token 중복 방지 큐 ────────────────────────────────────────────────
let isRefreshing = false;

type QueueEntry = {
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
};
const pendingQueue: QueueEntry[] = [];

function processQueue(token: string | null, error: unknown = null) {
    pendingQueue.forEach(({ resolve, reject }) => {
        if (token) resolve(token);
        else reject(error);
    });
    pendingQueue.length = 0;
}

// Response Interceptor — 모든 응답 후에 실행, 에러 처리 + 401 시 토큰 갱신
apiClient.interceptors.response.use(
    response => response,
    async error => {
        const status = error.response?.status;
        const originalConfig: InternalAxiosRequestConfig & {
            _retry?: boolean;
        } = error.config;

        if (status === 401 && !originalConfig._retry) {
            if (isRefreshing) {
                // 이미 갱신 중이면 큐에 쌓아두고 완료 후 재시도
                return new Promise<string>((resolve, reject) => {
                    pendingQueue.push({ resolve, reject });
                }).then(token => {
                    originalConfig.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalConfig);
                });
            }

            originalConfig._retry = true;
            isRefreshing = true;

            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { useAuthStore } = require('@/store/auth-store');

            try {
                const { refreshToken, setTokens } = useAuthStore.getState();
                if (!refreshToken) throw new Error('No refresh token');

                // apiClient 인터셉터를 거치지 않도록 axios 직접 호출
                const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
                    refreshToken,
                });

                setTokens(data.accessToken, data.refreshToken);
                processQueue(data.accessToken);

                originalConfig.headers.Authorization = `Bearer ${data.accessToken}`;
                return apiClient(originalConfig);
            } catch (refreshError) {
                processQueue(null, refreshError);
                useAuthStore.getState().logOut();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (status === 404) {
            console.warn('[API] 리소스를 찾을 수 없습니다:', error.config?.url);
        } else {
            console.error('[API] 서버 에러:', status, error.message);
        }

        return Promise.reject(error);
    },
);

export default apiClient;
