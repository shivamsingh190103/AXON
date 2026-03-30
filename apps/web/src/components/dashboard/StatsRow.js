import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { counterVariants, fadeInUp } from '@/lib/animations';
import { scoreToColor } from '@/utils/scoreToColor';
function StatCard({ title, value, subtitle, color }) {
    return (_jsxs(motion.div, { variants: fadeInUp, className: "rounded-2xl border border-white/5 bg-[var(--panel)] p-5 transition hover:-translate-y-0.5 hover:border-white/15 hover:shadow-xl", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.12em] text-slate-400", children: title }), _jsx(motion.p, { variants: counterVariants, className: "display mt-3 text-5xl font-bold", style: { color: color ?? 'var(--text)' }, children: value }), _jsx("p", { className: "mt-2 text-sm text-slate-400", children: subtitle })] }));
}
export function StatsRow({ totalAnalyses, avgScore, dropPoints }) {
    return (_jsxs(motion.div, { className: "grid gap-4 md:grid-cols-3", initial: "hidden", animate: "visible", variants: { visible: { transition: { staggerChildren: 0.08 } } }, children: [_jsx(StatCard, { title: "Total Analyses", value: `${totalAnalyses}`, subtitle: "+4 this week", color: "var(--success)" }), _jsx(StatCard, { title: "Avg Neural Score", value: `${avgScore}`, subtitle: "vs last week", color: scoreToColor(avgScore) }), _jsx(StatCard, { title: "Drop Points Found", value: `${dropPoints}`, subtitle: "catch them before publishing", color: "var(--danger)" })] }));
}
