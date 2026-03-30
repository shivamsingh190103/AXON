import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { scoreRingVariants } from '@/lib/animations';
import { scoreToColor } from '@/utils/scoreToColor';
export function ScoreRing({ score }) {
    const color = scoreToColor(score);
    return (_jsxs("div", { className: "relative grid place-items-center", children: [_jsxs("svg", { width: "110", height: "110", viewBox: "0 0 120 120", "aria-label": `Neural score: ${score} out of 100`, children: [_jsx("circle", { cx: "60", cy: "60", r: "46", stroke: "#141424", strokeWidth: "7", fill: "none" }), _jsx(motion.circle, { cx: "60", cy: "60", r: "46", stroke: color, strokeWidth: "7", fill: "none", strokeLinecap: "round", transform: "rotate(-90 60 60)", variants: scoreRingVariants(score), initial: "hidden", animate: "visible" })] }), _jsxs("div", { className: "absolute text-center", children: [_jsx("p", { className: "display text-3xl font-extrabold", children: score }), _jsx("p", { className: "mono text-[10px] text-slate-400", children: "/100" })] })] }));
}
