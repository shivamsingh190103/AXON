import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';
export const api = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
    timeout: 15000
});
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    const csrfToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrf_token='))
        ?.split('=')[1];
    if (csrfToken && config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
        config.headers['x-csrf-token'] = csrfToken;
    }
    return config;
});
let refreshingPromise = null;
async function refreshAccessToken() {
    if (!refreshingPromise) {
        refreshingPromise = api
            .post('/auth/refresh', {})
            .then((response) => {
            const data = response.data?.data;
            if (data?.accessToken && data?.user) {
                useAuthStore.getState().setAuth(data.user, data.accessToken);
                return data.accessToken;
            }
            return null;
        })
            .catch(() => {
            useAuthStore.getState().clearAuth();
            return null;
        })
            .finally(() => {
            refreshingPromise = null;
        });
    }
    return refreshingPromise;
}
api.interceptors.response.use((response) => response, async (error) => {
    if (error.response?.status === 401 && !error.config?._retry) {
        error.config._retry = true;
        const token = await refreshAccessToken();
        if (token) {
            error.config.headers.Authorization = `Bearer ${token}`;
            return api(error.config);
        }
    }
    return Promise.reject(error);
});
