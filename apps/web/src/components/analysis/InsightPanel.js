import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { AlertTriangle, Bolt, Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScoreRing } from './ScoreRing';
import { formatTime } from '@/utils/formatTime';
import { scoreToColor } from '@/utils/scoreToColor';
function scoreSummary(score) {
    if (score >= 80)
        return 'Strong Retention';
    if (score >= 60)
        return 'Needs Work';
    if (score >= 40)
        return 'Risky';
    return 'High Risk';
}
export function InsightPanel({ overallScore, hookScore, boredomScore, emotionScore, hookValues, boredomValues, emotionValues, currentSecond, insights, onSeek, onShare, onExport, onDelete }) {
    const hookNow = Math.round(hookValues[currentSecond] ?? hookValues[0] ?? 0);
    const boredomNow = Math.round(boredomValues[currentSecond] ?? boredomValues[0] ?? 0);
    const emotionNow = Math.round(emotionValues[currentSecond] ?? emotionValues[0] ?? 0);
    const liveCard = useMemo(() => {
        if (boredomNow > 70) {
            return {
                icon: _jsx(AlertTriangle, { size: 16 }),
                title: `High Boredom Risk - DMN ${boredomNow}/100`,
                tone: 'bg-rose-500/15 text-rose-300 border-rose-500/35'
            };
        }
        if (emotionNow > 80) {
            return {
                icon: _jsx(Star, { size: 16 }),
                title: `Emotional Peak - TPJ ${emotionNow}/100`,
                tone: 'bg-amber-500/15 text-amber-300 border-amber-500/35'
            };
        }
        if (hookNow > 80) {
            return {
                icon: _jsx(Bolt, { size: 16 }),
                title: `Strong Hook - Visual+Audio ${hookNow}/100`,
                tone: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35'
            };
        }
        return null;
    }, [boredomNow, emotionNow, hookNow]);
    return (_jsxs("aside", { className: "space-y-3 overflow-y-auto", children: [_jsxs("section", { className: "liquid-glass rounded-2xl p-4", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h3", { className: "display text-lg font-bold", children: "Neural Score" }), _jsx(Badge, { color: "default", children: "Overall" })] }), _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx(ScoreRing, { score: overallScore }), _jsxs("div", { className: "text-right", children: [_jsx(Badge, { color: overallScore > 70 ? 'green' : overallScore > 40 ? 'amber' : 'red', children: scoreSummary(overallScore) }), _jsx("p", { className: "mt-2 text-xs text-slate-400", style: { color: scoreToColor(overallScore) }, children: "Higher score means better biological retention prediction." })] })] })] }), _jsxs("section", { className: "liquid-glass rounded-2xl p-4", children: [_jsx("p", { className: "mb-2 text-xs uppercase tracking-[0.12em] text-slate-400", children: "Metrics" }), _jsx("div", { className: "space-y-2", children: [
                            { label: 'Sensory Hook', value: hookScore, color: 'bg-cyan-400' },
                            { label: 'Boredom Risk', value: boredomScore, color: 'bg-rose-400' },
                            { label: 'Emotional Impact', value: emotionScore, color: 'bg-amber-400' }
                        ].map((metric) => (_jsxs("button", { className: "focus-ring flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/5", onClick: () => onSeek(0), children: [_jsx("span", { className: `size-2 rounded-full ${metric.color}` }), _jsx("span", { className: "text-sm text-slate-300", children: metric.label }), _jsx("div", { className: "mx-2 h-1 flex-1 rounded bg-white/10", children: _jsx("div", { className: `h-full rounded ${metric.color}`, style: { width: `${metric.value}%` } }) }), _jsx("span", { className: "mono text-xs text-slate-300", children: metric.value })] }, metric.label))) })] }), _jsxs("section", { className: "liquid-glass rounded-2xl p-4", children: [_jsxs("h4", { className: "display text-lg font-bold", children: ["At ", formatTime(currentSecond)] }), _jsxs("div", { className: "mt-2 space-y-1 text-sm text-slate-300", children: [_jsxs("p", { children: ["Hook: ", hookNow] }), _jsxs("p", { children: ["Boredom: ", boredomNow] }), _jsxs("p", { children: ["Emotion: ", emotionNow] })] }), liveCard ? (_jsxs("div", { className: `mt-3 rounded-xl border p-3 text-sm ${liveCard.tone}`, children: [_jsx("div", { className: "flex items-center gap-2", children: liveCard.icon }), _jsx("p", { className: "mt-1", children: liveCard.title })] })) : null] }), _jsxs("section", { className: "liquid-glass rounded-2xl p-4", children: [_jsxs("div", { className: "mb-3 flex items-center justify-between", children: [_jsx("h4", { className: "display text-lg font-bold", children: "All Insights" }), _jsx(Badge, { color: "default", children: insights.length })] }), _jsxs("div", { className: "space-y-2", children: [insights.length === 0 ? _jsx("p", { className: "text-sm text-slate-400", children: "No critical issues found. This video scores well across all metrics." }) : null, insights.map((insight, index) => (_jsxs("button", { className: "focus-ring w-full rounded-xl border border-white/10 bg-black/20 p-3 text-left text-sm transition hover:bg-white/5", onClick: () => onSeek(insight.timestampSeconds), children: [_jsxs("div", { className: "mb-1 flex items-center justify-between", children: [_jsx(Badge, { color: insight.type === 'BOREDOM_SPIKE' ? 'red' : insight.type === 'EMOTION_PEAK' ? 'amber' : 'cyan', children: insight.type.replaceAll('_', ' ') }), _jsx("span", { className: "mono text-xs text-slate-500", children: formatTime(insight.timestampSeconds) })] }), _jsx("p", { children: insight.description })] }, `${insight.type}-${insight.timestampSeconds}-${index}`)))] })] }), _jsx("section", { className: "liquid-glass rounded-2xl p-4", children: _jsxs("div", { className: "space-y-2", children: [_jsx(Button, { fullWidth: true, onClick: onExport, children: "Export as JSON" }), _jsx(Button, { fullWidth: true, variant: "secondary", onClick: onShare, children: "Share report" }), _jsx(Button, { fullWidth: true, variant: "ghost", onClick: () => (window.location.href = '/dashboard'), children: "Analyse another video" }), _jsx("button", { className: "focus-ring w-full text-center text-xs text-rose-300", onClick: onDelete, children: "Delete this analysis" })] }) })] }));
}
