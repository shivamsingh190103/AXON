import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { AlertTriangle, Play, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { formatTime } from '@/utils/formatTime';
function statusBadge(status) {
    if (status === 'COMPLETED')
        return _jsx(Badge, { color: "green", children: "Completed" });
    if (status === 'FAILED')
        return _jsx(Badge, { color: "red", children: "Failed" });
    return _jsx(Badge, { color: "primary", children: status });
}
export function ProjectCard({ id, title, originalFilename, status, createdAt, durationSeconds, overallScore }) {
    const navigate = useNavigate();
    const name = title || originalFilename || 'Untitled analysis';
    return (_jsxs(motion.button, { className: "group liquid-glass focus-ring overflow-hidden rounded-2xl border border-white/8 bg-[var(--panel)] text-left", onClick: () => navigate(`/analysis/${id}`), initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 }, children: [_jsxs("div", { className: "relative h-36 bg-gradient-to-br from-[#1b2244] via-[#14142e] to-[#241438]", children: [_jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_65%_25%,rgba(124,109,250,0.35),transparent_45%)]" }), _jsxs("div", { className: "absolute bottom-2 left-2 right-2 flex items-center justify-between", children: [_jsx("span", { className: "mono text-[10px] uppercase tracking-[0.12em] text-slate-300", children: "Neural Map" }), status === 'FAILED' ? _jsx(AlertTriangle, { size: 16, className: "text-rose-300" }) : _jsx(Sparkles, { size: 16, className: "text-violet-200" })] }), _jsx("div", { className: "absolute inset-0 grid place-items-center", children: status === 'FAILED' ? (_jsx("div", { className: "rounded-full bg-rose-500/20 p-3 text-rose-300", children: _jsx(AlertTriangle, { size: 18 }) })) : (_jsx("div", { className: "rounded-full bg-black/50 p-3 text-white transition group-hover:scale-110 group-hover:bg-[var(--primary)]", children: _jsx(Play, { size: 18, fill: "currentColor" }) })) })] }), _jsxs("div", { className: "space-y-2 p-4", children: [_jsx("p", { className: "truncate text-sm font-semibold text-white", title: name, children: name }), _jsxs("p", { className: "mono text-[11px] text-slate-500", children: [new Date(createdAt).toLocaleDateString(), " ", durationSeconds ? `· ${formatTime(durationSeconds)}` : ''] }), _jsxs("div", { className: "flex items-center justify-between", children: [statusBadge(status), typeof overallScore === 'number' ? _jsxs(Badge, { color: overallScore > 70 ? 'green' : overallScore > 40 ? 'amber' : 'red', children: [overallScore, " / 100"] }) : null] })] })] }));
}
