import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/axios';
import { ScoreRing } from '@/components/analysis/ScoreRing';
export function SharedAnalysisPage() {
    const { token } = useParams();
    const { data, isLoading } = useQuery({
        queryKey: ['shared-analysis', token],
        queryFn: async () => {
            const response = await api.get(`/share/${token}`);
            return response.data;
        },
        enabled: Boolean(token)
    });
    if (isLoading) {
        return _jsx("div", { className: "grid min-h-screen place-items-center text-slate-400", children: "Loading shared report..." });
    }
    const payload = data?.data;
    if (!payload) {
        return _jsx("div", { className: "grid min-h-screen place-items-center text-slate-400", children: "Share link is invalid or expired." });
    }
    return (_jsxs("div", { className: "mx-auto max-w-4xl p-6", children: [_jsx("h1", { className: "display text-4xl font-extrabold", children: "AXON Shared Report" }), _jsx("p", { className: "mt-2 text-slate-400", children: payload.originalFilename ?? payload.title ?? 'Untitled video' }), _jsxs("div", { className: "mt-8 grid gap-4 rounded-2xl border border-white/10 bg-[#0b0b16] p-6 md:grid-cols-[160px_1fr]", children: [_jsx(ScoreRing, { score: payload.result.overallScore }), _jsxs("div", { children: [_jsxs("p", { className: "text-sm text-slate-400", children: ["Hook: ", payload.result.hookScore] }), _jsxs("p", { className: "text-sm text-slate-400", children: ["Boredom: ", payload.result.boredomScore] }), _jsxs("p", { className: "text-sm text-slate-400", children: ["Emotion: ", payload.result.emotionScore] }), _jsx("p", { className: "mt-2 text-sm text-slate-300", children: payload.result.gradeSummary })] })] })] }));
}
