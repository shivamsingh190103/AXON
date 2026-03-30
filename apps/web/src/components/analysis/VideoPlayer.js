import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { formatTime } from '@/utils/formatTime';
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
export function VideoPlayer({ src, currentTime, onTimeChange, onDurationChange }) {
    const videoRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [speed, setSpeed] = useState(1);
    useEffect(() => {
        const video = videoRef.current;
        if (!video)
            return;
        let raf = 0;
        const loop = () => {
            onTimeChange(video.currentTime);
            raf = requestAnimationFrame(loop);
        };
        const onLoadedMetadata = () => {
            onDurationChange(video.duration || 0);
        };
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        raf = requestAnimationFrame(loop);
        return () => {
            cancelAnimationFrame(raf);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
    }, [onDurationChange, onTimeChange]);
    useEffect(() => {
        const onKeyDown = (event) => {
            const video = videoRef.current;
            if (!video)
                return;
            if (event.key === ' ') {
                event.preventDefault();
                if (video.paused) {
                    void video.play();
                    setPlaying(true);
                }
                else {
                    video.pause();
                    setPlaying(false);
                }
            }
            if (event.key === 'ArrowLeft')
                video.currentTime = Math.max(0, video.currentTime - 5);
            if (event.key === 'ArrowRight')
                video.currentTime = video.currentTime + 5;
            if (event.key.toLowerCase() === 'j')
                video.currentTime = Math.max(0, video.currentTime - 10);
            if (event.key.toLowerCase() === 'l')
                video.currentTime = video.currentTime + 10;
            if (event.key.toLowerCase() === 'm') {
                video.muted = !video.muted;
                setMuted(video.muted);
            }
            if (event.key.toLowerCase() === 'f') {
                void video.requestFullscreen();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);
    const duration = useMemo(() => videoRef.current?.duration || 0, [src, currentTime]);
    const togglePlay = async () => {
        const video = videoRef.current;
        if (!video)
            return;
        if (video.paused) {
            await video.play();
            setPlaying(true);
        }
        else {
            video.pause();
            setPlaying(false);
        }
    };
    const toggleMute = () => {
        const video = videoRef.current;
        if (!video)
            return;
        video.muted = !video.muted;
        setMuted(video.muted);
    };
    const cycleSpeed = () => {
        const video = videoRef.current;
        if (!video)
            return;
        const index = SPEEDS.indexOf(speed);
        const next = SPEEDS[(index + 1) % SPEEDS.length];
        video.playbackRate = next;
        setSpeed(next);
    };
    const seek = (event) => {
        const video = videoRef.current;
        if (!video || !duration)
            return;
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = (event.clientX - rect.left) / rect.width;
        video.currentTime = Math.max(0, Math.min(duration, ratio * duration));
    };
    const changeVolume = (value) => {
        const video = videoRef.current;
        if (!video)
            return;
        video.volume = value;
        video.muted = value === 0;
        setVolume(value);
        setMuted(video.muted);
    };
    return (_jsxs("div", { children: [_jsxs("div", { className: "relative grid min-h-[280px] place-items-center overflow-hidden rounded-2xl bg-black lg:min-h-[440px]", children: [src ? _jsx("video", { ref: videoRef, src: src, className: "max-h-[72vh] w-full object-contain", playsInline: true }) : _jsx("p", { className: "text-slate-500", children: "No playback URL available" }), !playing ? (_jsx("button", { className: "focus-ring absolute grid size-[72px] place-items-center rounded-full bg-[var(--primary)]/85 text-white shadow-[0_0_30px_rgba(124,109,250,0.35)]", onClick: togglePlay, children: _jsx(Play, { fill: "currentColor" }) })) : null] }), _jsxs("div", { className: "mt-3 flex h-[52px] items-center gap-3 rounded-xl border border-white/10 bg-[#0b0b16] px-3", children: [_jsx("button", { className: "focus-ring grid size-8 place-items-center rounded-full bg-[var(--primary)] text-white", onClick: togglePlay, children: playing ? _jsx(Pause, { size: 14 }) : _jsx(Play, { size: 14, fill: "currentColor" }) }), _jsxs("span", { className: "mono text-xs text-slate-300", children: [formatTime(currentTime), " / ", formatTime(duration)] }), _jsxs("div", { className: "group relative h-2 flex-1 cursor-pointer rounded bg-[#141424]", onClick: seek, children: [_jsx("div", { className: "h-full rounded bg-[var(--primary)]", style: { width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` } }), _jsx("div", { className: "absolute top-1/2 size-3 -translate-y-1/2 rounded-full border border-white bg-[var(--primary)] opacity-0 transition group-hover:opacity-100", style: { left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` } })] }), _jsx("button", { className: "focus-ring text-slate-300", onClick: toggleMute, children: muted ? _jsx(VolumeX, { size: 16 }) : _jsx(Volume2, { size: 16 }) }), _jsx("input", { type: "range", min: 0, max: 1, step: 0.01, value: volume, onChange: (event) => changeVolume(Number(event.target.value)), className: "w-16" }), _jsxs("button", { className: "focus-ring mono text-xs text-slate-300", onClick: cycleSpeed, children: [speed, "x"] }), _jsx("button", { className: "focus-ring text-slate-300", onClick: () => videoRef.current?.requestFullscreen(), children: _jsx(Maximize, { size: 15 }) })] })] }));
}
