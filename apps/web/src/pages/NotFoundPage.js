import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
export function NotFoundPage() {
    return (_jsx("div", { className: "grid min-h-screen place-items-center p-6 text-center", children: _jsxs("div", { children: [_jsx("h1", { className: "display text-4xl font-extrabold", children: "Page not found" }), _jsx("p", { className: "mt-2 text-slate-400", children: "The page you are looking for does not exist." }), _jsx(Link, { className: "focus-ring mt-5 inline-block rounded-xl bg-[var(--primary)] px-4 py-2", to: "/dashboard", children: "Back to dashboard" })] }) }));
}
