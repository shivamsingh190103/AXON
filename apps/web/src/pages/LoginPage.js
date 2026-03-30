import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { loginSchema } from '@axon/shared';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { shakeVariants } from '@/lib/animations';
export function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [shake, setShake] = useState(false);
    const setAuth = useAuthStore((s) => s.setAuth);
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(loginSchema),
        mode: 'onBlur'
    });
    const onSubmit = handleSubmit(async (values) => {
        try {
            const response = await api.post('/auth/login', values);
            const payload = response.data?.data;
            setAuth(payload.user, payload.accessToken);
            toast.success('Welcome back');
            navigate('/dashboard');
        }
        catch (error) {
            setShake(true);
            setTimeout(() => setShake(false), 450);
            const message = error.response?.data?.error?.code;
            if (message === 'INVALID_CREDENTIALS') {
                toast.error('Invalid credentials. Please try again.');
            }
            else {
                toast.error('Connection error. Check your internet and try again.');
            }
        }
    });
    return (_jsxs("div", { className: "grid min-h-screen md:grid-cols-[640px_1fr]", children: [_jsxs("aside", { className: "relative hidden overflow-hidden border-r border-white/10 bg-[#08080f] p-10 md:flex md:flex-col", children: [_jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_20%_70%,rgba(124,109,250,0.08),transparent_50%)]" }), _jsx("p", { className: "display relative text-2xl font-extrabold tracking-[0.14em]", children: "AXON" }), _jsx(motion.h1, { className: "display relative mt-16 text-5xl font-extrabold leading-tight text-white", initial: "hidden", animate: "visible", variants: { visible: { transition: { staggerChildren: 0.08 } } }, children: ['See', 'what', 'your', 'audience', 'feels.'].map((word) => (_jsx(motion.span, { className: "mr-3 inline-block", variants: { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }, children: word }, word))) }), _jsx("p", { className: "relative mt-5 max-w-md text-sm leading-7 text-slate-400", children: "Neural engagement scoring for video creators. Know exactly where attention drops before you publish." }), _jsx("div", { className: "relative mt-10 space-y-4", children: [
                            { label: 'HOOK', color: 'from-cyan-400/60 to-cyan-200/10' },
                            { label: 'BOREDOM', color: 'from-rose-400/60 to-rose-200/10' },
                            { label: 'EMOTION', color: 'from-amber-400/60 to-amber-200/10' }
                        ].map((track, index) => (_jsxs("div", { children: [_jsx("p", { className: "mono mb-1 text-xs text-slate-500", children: track.label }), _jsx("div", { className: "h-3 overflow-hidden rounded bg-[#111220]", children: _jsx("div", { className: `h-full w-full bg-gradient-to-r ${track.color} animate-pulse`, style: { animationDuration: `${2.4 + index * 0.5}s` } }) })] }, track.label))) }), _jsxs("div", { className: "relative mt-auto flex gap-2 pt-10", children: [_jsx("span", { className: "mono rounded-full border border-[#1c1c2e] bg-[#0e0e1a] px-3 py-1 text-[11px] text-slate-500", children: "TRIBE v2 powered" }), _jsx("span", { className: "mono rounded-full border border-[#1c1c2e] bg-[#0e0e1a] px-3 py-1 text-[11px] text-slate-500", children: "1Hz resolution" }), _jsx("span", { className: "mono rounded-full border border-[#1c1c2e] bg-[#0e0e1a] px-3 py-1 text-[11px] text-slate-500", children: "No hardware" })] })] }), _jsx("main", { className: "grid place-items-center p-6", children: _jsxs(motion.form, { className: "w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b16] p-6", onSubmit: onSubmit, variants: shakeVariants, animate: shake ? 'shake' : undefined, style: { opacity: isSubmitting ? 0.7 : 1 }, children: [_jsx("h2", { className: "display mb-1 text-3xl font-extrabold", children: "Sign in" }), _jsx("p", { className: "mb-6 text-sm text-slate-400", children: "Continue to your dashboard." }), _jsx("label", { className: "mb-2 block text-sm text-slate-300", children: "Email address" }), _jsx(Input, { type: "email", autoComplete: "email", ...register('email'), error: errors.email?.message }), errors.email?.message ? _jsx("p", { className: "error-text", children: errors.email.message }) : null, _jsx("label", { className: "mb-2 mt-4 block text-sm text-slate-300", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { type: showPassword ? 'text' : 'password', autoComplete: "current-password", ...register('password'), error: errors.password?.message }), _jsx("button", { className: "focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-slate-500", type: "button", onClick: () => setShowPassword((prev) => !prev), children: showPassword ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) })] }), errors.password?.message ? _jsx("p", { className: "error-text", children: errors.password.message }) : null, _jsx("div", { className: "mt-2 text-right", children: _jsx(Link, { to: "#", className: "text-xs text-slate-400 hover:text-white", children: "Forgot password?" }) }), _jsxs(Button, { className: "mt-5", fullWidth: true, type: "submit", disabled: isSubmitting, children: [isSubmitting ? _jsx(Loader2, { className: "animate-spin", size: 16 }) : null, isSubmitting ? 'Signing in...' : 'Continue'] }), _jsxs("div", { className: "my-4 flex items-center gap-2 text-xs text-slate-500", children: [_jsx("div", { className: "h-px flex-1 bg-white/10" }), "or", _jsx("div", { className: "h-px flex-1 bg-white/10" })] }), _jsx("a", { href: `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001'}/api/v1/auth/google`, children: _jsx(Button, { variant: "ghost", fullWidth: true, type: "button", children: "Continue with Google" }) }), _jsxs("p", { className: "mt-5 text-center text-sm text-slate-400", children: ["New to AXON?", ' ', _jsx(Link, { to: "/register", className: "text-violet-300 hover:text-violet-200", children: "Start for free" })] })] }) })] }));
}
