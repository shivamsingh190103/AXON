import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { SplashPage } from './SplashPage';
export function AuthSuccessPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);
    useEffect(() => {
        const token = params.get('accessToken');
        if (!token) {
            navigate('/login');
            return;
        }
        const bootstrap = async () => {
            const response = await api.get('/auth/me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setAuth(response.data.data, token);
            navigate('/dashboard');
        };
        void bootstrap().catch(() => navigate('/login'));
    }, [navigate, params, setAuth]);
    return _jsx(SplashPage, {});
}
