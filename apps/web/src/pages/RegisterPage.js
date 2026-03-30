import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { registerSchema } from '@axon/shared';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
function passwordStrength(password) {
    let score = 0;
    if (password.length >= 8)
        score += 1;
    if (/[A-Z]/.test(password))
        score += 1;
    if (/\d/.test(password))
        score += 1;
    if (/[^a-zA-Z0-9]/.test(password))
        score += 1;
    return score;
}
export function RegisterPage() {
    const [password, setPassword] = useState('');
    const strength = useMemo(() => passwordStrength(password), [password]);
    const setAuth = useAuthStore((s) => s.setAuth);
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(registerSchema),
        mode: 'onBlur'
    });
    const onSubmit = handleSubmit(async (values) => {
        try {
            const response = await api.post('/auth/register', values);
            const payload = response.data?.data;
            setAuth(payload.user, payload.accessToken);
            toast.success('Welcome to AXON');
            navigate('/dashboard');
        }
        catch (error) {
            const code = error.response?.data?.error?.code;
            if (code === 'EMAIL_EXISTS') {
                toast.error('Email already exists');
            }
            else {
                toast.error('Something went wrong. Please try again.');
            }
        }
    });
    return (_jsx("div", { className: "grid min-h-screen place-items-center p-6", children: _jsxs("form", { className: "w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b16] p-6", onSubmit: onSubmit, children: [_jsx("h2", { className: "display mb-1 text-3xl font-extrabold", children: "Create account" }), _jsx("p", { className: "mb-6 text-sm text-slate-400", children: "Start analyzing your videos in minutes." }), _jsx("label", { className: "mb-2 block text-sm text-slate-300", children: "Full name" }), _jsx(Input, { type: "text", autoComplete: "name", ...register('name'), error: errors.name?.message }), errors.name?.message ? _jsx("p", { className: "error-text", children: errors.name.message }) : null, _jsx("label", { className: "mb-2 mt-4 block text-sm text-slate-300", children: "Email address" }), _jsx(Input, { type: "email", autoComplete: "email", ...register('email'), error: errors.email?.message }), errors.email?.message ? _jsx("p", { className: "error-text", children: errors.email.message }) : null, _jsx("label", { className: "mb-2 mt-4 block text-sm text-slate-300", children: "Password" }), _jsx(Input, { type: "password", autoComplete: "new-password", ...register('password'), onChange: (event) => setPassword(event.target.value), error: errors.password?.message }), errors.password?.message ? _jsx("p", { className: "error-text", children: errors.password.message }) : null, _jsx("div", { className: "mt-3 grid grid-cols-4 gap-2", children: [0, 1, 2, 3].map((index) => (_jsx("div", { className: `h-1.5 rounded-full ${strength > index ? (index < 1 ? 'bg-rose-400' : index < 3 ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-white/10'}` }, index))) }), _jsxs(Button, { className: "mt-6", fullWidth: true, type: "submit", disabled: isSubmitting, children: [isSubmitting ? _jsx(Loader2, { className: "animate-spin", size: 16 }) : null, isSubmitting ? 'Creating account...' : 'Create account'] }), _jsxs("p", { className: "mt-5 text-center text-sm text-slate-400", children: ["Already have an account?", ' ', _jsx(Link, { to: "/login", className: "text-violet-300 hover:text-violet-200", children: "Sign in" })] })] }) }));
}
