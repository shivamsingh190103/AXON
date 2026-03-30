import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Loader2 } from 'lucide-react';
export function ProcessingModal({ step, progress }) {
    return (_jsxs("div", { className: "liquid-glass mx-auto max-w-xl rounded-3xl border border-white/10 p-8 text-center", children: [_jsx(Loader2, { className: "mx-auto mb-4 animate-spin text-[var(--primary)]" }), _jsx("h3", { className: "display text-2xl font-bold", children: "Running neural analysis" }), _jsx("p", { className: "mt-2 text-slate-400", children: "TRIBE v2 is processing your video." }), _jsx("p", { className: "mono mt-4 text-xs uppercase tracking-[0.14em] text-slate-500", children: step }), _jsx("div", { className: "mt-4 h-2 overflow-hidden rounded-full bg-white/10", children: _jsx("div", { className: "h-full bg-[var(--primary)] transition-all", style: { width: `${progress}%` } }) }), _jsxs("p", { className: "mono mt-2 text-xs text-slate-400", children: [Math.round(progress), "%"] })] }));
}
