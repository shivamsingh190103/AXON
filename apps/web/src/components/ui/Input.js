import { jsx as _jsx } from "react/jsx-runtime";
import clsx from 'clsx';
export function Input({ error, success, className, ...props }) {
    return (_jsx("input", { className: clsx('input-base focus-ring', error && 'border-[var(--danger)] shadow-[0_0_0_3px_rgba(248,113,113,0.12)]', success && 'border-[var(--success)]', className), ...props }));
}
