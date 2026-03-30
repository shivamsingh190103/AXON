import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
export function ShareModal({ open, onClose, shareUrl }) {
    const copyLink = async () => {
        if (!shareUrl)
            return;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied');
    };
    return (_jsxs(Modal, { open: open, onClose: onClose, title: "Share report", children: [_jsx("p", { className: "mb-3 text-sm text-slate-400", children: "Anyone with this link can view a read-only version for 7 days." }), _jsx("div", { className: "rounded-xl border border-white/10 bg-black/30 p-3 mono text-xs text-slate-300", children: shareUrl ?? 'Generate a share link first' }), _jsxs(Button, { className: "mt-4", fullWidth: true, onClick: copyLink, disabled: !shareUrl, children: [_jsx(Copy, { size: 16 }), " Copy link"] })] }));
}
