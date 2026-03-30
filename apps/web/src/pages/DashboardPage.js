import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useAnalyses } from '@/hooks/useAnalysis';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { UploadCTA } from '@/components/dashboard/UploadCTA';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { UploadModal } from '@/components/modals/UploadModal';
import { useUiStore } from '@/stores/uiStore';
function greetingByHour() {
    const hour = new Date().getHours();
    if (hour < 12)
        return 'Good morning';
    if (hour < 18)
        return 'Good afternoon';
    return 'Good evening';
}
export function DashboardPage() {
    const user = useAuthStore((s) => s.user);
    const { data, isLoading } = useAnalyses();
    const analyses = data?.data ?? [];
    const uploadModalOpen = useUiStore((s) => s.uploadModalOpen);
    const setUploadModalOpen = useUiStore((s) => s.setUploadModalOpen);
    const stats = useMemo(() => {
        const completed = analyses.filter((a) => a.status === 'COMPLETED');
        const avgScore = completed.length
            ? Math.round(completed.reduce((sum, item) => sum + (item.overallScore ?? 0), 0) / completed.length)
            : 0;
        return {
            total: analyses.length,
            avgScore,
            dropPoints: completed.length * 2 + 1
        };
    }, [analyses]);
    return (_jsxs("div", { className: "min-h-screen bg-transparent", children: [_jsx(Topbar, { onOpenUpload: () => setUploadModalOpen(true) }), _jsxs("div", { className: "flex", children: [_jsx(Sidebar, {}), _jsxs(PageWrapper, { children: [_jsxs(motion.section, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, children: [_jsxs("h1", { className: "display text-3xl font-extrabold", children: [greetingByHour(), ",", ' ', _jsx("span", { className: "text-[var(--primary)]", children: user?.name ?? 'Creator' })] }), _jsxs("p", { className: "mt-2 text-sm text-slate-400", children: ["You have ", analyses.length, " analyses this week. Your avg Hook Score is ", stats.avgScore, "%."] })] }), _jsx("div", { className: "mt-6", children: _jsx(StatsRow, { totalAnalyses: stats.total, avgScore: stats.avgScore, dropPoints: stats.dropPoints }) }), _jsx(UploadCTA, { onClick: () => setUploadModalOpen(true) }), _jsxs("section", { className: "mt-8", children: [_jsx("div", { className: "mb-4 flex items-center justify-between", children: _jsx("h2", { className: "display text-sm uppercase tracking-[0.12em] text-slate-300", children: "Recent analyses" }) }), isLoading ? _jsx("p", { className: "text-slate-500", children: "Loading analyses..." }) : null, !isLoading && analyses.length === 0 ? (_jsxs("div", { className: "grid place-items-center rounded-2xl border border-white/10 bg-black/20 p-12 text-center", children: [_jsx("p", { className: "display text-2xl font-bold", children: "Your analyses will appear here" }), _jsx("p", { className: "mt-2 text-slate-400", children: "Upload a video to get your first neural engagement report." })] })) : null, _jsx("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: analyses.map((analysis) => (_jsx(ProjectCard, { ...analysis }, analysis.id))) }), user?.plan === 'FREE' ? (_jsxs("div", { className: "mt-8 rounded-2xl border border-amber-400/30 bg-amber-500/8 p-4 text-sm text-amber-100", children: ["You have used ", user.analysesThisMonth, "/3 free analyses this month. Upgrade for more."] })) : null] })] })] }), _jsx(UploadModal, { open: uploadModalOpen, onClose: () => setUploadModalOpen(false) })] }));
}
