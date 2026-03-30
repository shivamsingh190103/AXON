import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useInitializeAuth } from '@/hooks/useAuth';
import { pageTransition } from '@/lib/animations';
import { SplashPage } from '@/pages/SplashPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AuthSuccessPage } from '@/pages/AuthSuccessPage';
import { SharedAnalysisPage } from '@/pages/SharedAnalysisPage';
const AnalysisPage = lazy(() => import('@/pages/AnalysisPage').then((module) => ({ default: module.AnalysisPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
function ProtectedRoute({ children }) {
    const user = useAuthStore((s) => s.user);
    if (!user)
        return _jsx(Navigate, { to: "/login", replace: true });
    return children;
}
function PublicRoute({ children }) {
    const user = useAuthStore((s) => s.user);
    if (user)
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    return children;
}
export function App() {
    useInitializeAuth();
    const location = useLocation();
    const initializing = useAuthStore((s) => s.initializing);
    const user = useAuthStore((s) => s.user);
    if (initializing) {
        return _jsx(SplashPage, {});
    }
    return (_jsx(AnimatePresence, { mode: "wait", children: _jsx(motion.div, { variants: pageTransition, initial: "initial", animate: "animate", exit: "exit", children: _jsxs(Routes, { location: location, children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: user ? '/dashboard' : '/login', replace: true }) }), _jsx(Route, { path: "/login", element: _jsx(PublicRoute, { children: _jsx(LoginPage, {}) }) }), _jsx(Route, { path: "/register", element: _jsx(PublicRoute, { children: _jsx(RegisterPage, {}) }) }), _jsx(Route, { path: "/auth/success", element: _jsx(AuthSuccessPage, {}) }), _jsx(Route, { path: "/shared/:token", element: _jsx(SharedAnalysisPage, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(DashboardPage, {}) }) }), _jsx(Route, { path: "/analysis/:id", element: _jsx(ProtectedRoute, { children: _jsx(AnalysisPage, {}) }) }), _jsx(Route, { path: "/settings", element: _jsx(ProtectedRoute, { children: _jsx(SettingsPage, {}) }) }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }) }, location.pathname) }));
}
