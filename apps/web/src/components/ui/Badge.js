import { jsx as _jsx } from "react/jsx-runtime";
import clsx from 'clsx';
const colorMap = {
    default: 'bg-white/10 text-white/80 border-white/10',
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    red: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    primary: 'bg-[var(--primary)]/20 text-violet-200 border-[var(--primary)]/35',
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/35'
};
export function Badge({ children, color = 'default' }) {
    return (_jsx("span", { className: clsx('mono inline-flex items-center rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em]', colorMap[color]), children: children }));
}
