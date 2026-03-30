import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';
export function Modal({ open, onClose, title, children }) {
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape')
                onClose();
        };
        if (open) {
            window.addEventListener('keydown', onKeyDown);
        }
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose, open]);
    return (_jsx(AnimatePresence, { children: open ? (_jsx(motion.div, { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-lg", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: onClose, children: _jsxs(motion.div, { className: "liquid-glass w-full max-w-[520px] rounded-3xl border border-white/15 bg-[var(--panel)] p-8", initial: { opacity: 0, y: 20, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 20, scale: 0.98 }, transition: { duration: 0.24 }, onClick: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "mb-6 flex items-center justify-between", children: [_jsx("h2", { className: "display text-2xl font-bold", children: title }), _jsx("button", { className: "focus-ring rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white", onClick: onClose, "aria-label": "Close modal", children: _jsx(X, { size: 18 }) })] }), children] }) })) : null }));
}
