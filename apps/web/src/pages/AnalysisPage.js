import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { getSocket } from '@/lib/socket';
import { queryClient } from '@/lib/queryClient';
import { useAnalysis, useAnalysisStatus } from '@/hooks/useAnalysis';
import { useAuthStore } from '@/stores/authStore';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { VideoPlayer } from '@/components/analysis/VideoPlayer';
import { TimelineTracks } from '@/components/analysis/TimelineTracks';
import { InsightPanel } from '@/components/analysis/InsightPanel';
import { ProcessingModal } from '@/components/modals/ProcessingModal';
import { ShareModal } from '@/components/modals/ShareModal';
import { useUiStore } from '@/stores/uiStore';
export function AnalysisPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const accessToken = useAuthStore((s) => s.accessToken);
    const shareModalOpen = useUiStore((s) => s.shareModalOpen);
    const setShareModalOpen = useUiStore((s) => s.setShareModalOpen);
    const { data, isLoading, refetch } = useAnalysis(id);
    const detail = data?.data;
    const statusQuery = useAnalysisStatus(id, detail?.status !== 'COMPLETED');
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [shareUrl, setShareUrl] = useState(null);
    useEffect(() => {
        if (!id || !accessToken)
            return;
        const socket = getSocket(accessToken);
        socket.emit('subscribe:analysis', { analysisId: id });
        const onCompleted = (event) => {
            if (event.analysisId === id) {
                queryClient.invalidateQueries({ queryKey: ['analysis', id] });
                queryClient.invalidateQueries({ queryKey: ['analyses'] });
                toast.success('Your analysis is ready.');
            }
        };
        const onFailed = (event) => {
            if (event.analysisId === id) {
                toast.error(event.errorMessage || 'Analysis failed. Please retry.');
                queryClient.invalidateQueries({ queryKey: ['analysis', id] });
            }
        };
        socket.on('analysis:completed', onCompleted);
        socket.on('analysis:failed', onFailed);
        return () => {
            socket.emit('unsubscribe:analysis', { analysisId: id });
            socket.off('analysis:completed', onCompleted);
            socket.off('analysis:failed', onFailed);
        };
    }, [accessToken, id]);
    const result = detail?.result;
    const currentSecond = Math.floor(currentTime);
    const progress = statusQuery.data?.data?.progress ?? 0;
    const currentStep = statusQuery.data?.data?.currentStep ?? detail?.status ?? 'QUEUED';
    const insightDots = useMemo(() => {
        const insights = result?.insights ?? [];
        return insights;
    }, [result?.insights]);
    const handleSeek = (time) => {
        setCurrentTime(time);
        const video = document.querySelector('video');
        if (video) {
            video.currentTime = time;
        }
    };
    const handleExport = async () => {
        if (!id)
            return;
        try {
            const response = await api.get(`/analyses/${id}/export?format=json`, { responseType: 'blob' });
            const url = URL.createObjectURL(response.data);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `analysis-${id}.json`;
            anchor.click();
            URL.revokeObjectURL(url);
        }
        catch {
            toast.error('Export failed. Please try again.');
        }
    };
    const handleShare = async () => {
        if (!id)
            return;
        try {
            const response = await api.post(`/analyses/${id}/share`);
            setShareUrl(response.data.data.shareUrl);
            setShareModalOpen(true);
        }
        catch {
            toast.error('Could not generate share link.');
        }
    };
    const handleDelete = async () => {
        if (!id)
            return;
        if (!window.confirm('Delete this analysis permanently?'))
            return;
        try {
            await api.delete(`/analyses/${id}`);
            toast.success('Analysis deleted');
            navigate('/dashboard');
        }
        catch {
            toast.error('Could not delete this analysis.');
        }
    };
    if (!isLoading && !detail) {
        return (_jsx("div", { className: "grid min-h-screen place-items-center p-6 text-center", children: _jsxs("div", { children: [_jsx("h1", { className: "display text-4xl font-extrabold", children: "Analysis not found" }), _jsx("p", { className: "mt-2 text-slate-400", children: "This analysis may have been deleted or you may not have access to it." }), _jsx("button", { className: "focus-ring mt-5 rounded-xl bg-[var(--primary)] px-4 py-2", onClick: () => navigate('/dashboard'), children: "Back to dashboard" })] }) }));
    }
    const isProcessing = detail?.status && detail.status !== 'COMPLETED' && detail.status !== 'FAILED';
    return (_jsxs("div", { className: "min-h-screen", children: [_jsx(Topbar, {}), _jsxs("div", { className: "flex", children: [_jsx(Sidebar, {}), _jsxs("main", { className: "grid w-full gap-4 p-4 lg:grid-cols-[1fr_320px] lg:p-6", children: [_jsx("section", { children: isProcessing ? (_jsx("div", { className: "grid min-h-[520px] place-items-center rounded-2xl border border-white/10 bg-[#0b0b16] p-4", children: _jsx(ProcessingModal, { step: currentStep, progress: progress }) })) : detail?.status === 'FAILED' ? (_jsx("div", { className: "grid min-h-[520px] place-items-center rounded-2xl border border-rose-400/30 bg-rose-500/10 p-8 text-center", children: _jsxs("div", { children: [_jsx("h2", { className: "display text-3xl font-bold", children: "Analysis failed" }), _jsx("p", { className: "mt-2 text-rose-100", children: detail.errorMessage || 'Something went wrong while processing this video.' }), _jsxs("div", { className: "mt-4 flex justify-center gap-2", children: [_jsx("button", { className: "focus-ring rounded-xl bg-white/10 px-4 py-2", onClick: () => refetch(), children: "Try again" }), _jsx("button", { className: "focus-ring rounded-xl bg-[var(--primary)] px-4 py-2", onClick: () => navigate('/dashboard'), children: "Back to dashboard" })] })] }) })) : (_jsxs(_Fragment, { children: [_jsx(VideoPlayer, { src: detail?.playbackUrl ?? null, currentTime: currentTime, onTimeChange: setCurrentTime, onDurationChange: setDuration }), _jsx(TimelineTracks, { hook: result?.hookTimeseries ?? [], boredom: result?.boredomTimeseries ?? [], emotion: result?.emotionTimeseries ?? [], duration: duration, currentTime: currentTime, onSeek: handleSeek, insightDots: insightDots })] })) }), _jsx("section", { children: result ? (_jsx(InsightPanel, { overallScore: result.overallScore, hookScore: result.hookScore, boredomScore: result.boredomScore, emotionScore: result.emotionScore, hookValues: result.hookTimeseries ?? [], boredomValues: result.boredomTimeseries ?? [], emotionValues: result.emotionTimeseries ?? [], currentSecond: currentSecond, insights: result.insights ?? [], onSeek: handleSeek, onShare: handleShare, onExport: handleExport, onDelete: handleDelete })) : (_jsx("div", { className: "liquid-glass rounded-2xl p-4 text-sm text-slate-400", children: "No analysis result available yet." })) })] })] }), _jsx(ShareModal, { open: shareModalOpen, onClose: () => setShareModalOpen(false), shareUrl: shareUrl })] }));
}
