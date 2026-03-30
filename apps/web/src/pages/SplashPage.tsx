import { motion } from 'framer-motion'

export function SplashPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#04040a]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="text-center"
      >
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(124,109,250,0.8),rgba(124,109,250,0.2))] shadow-[0_0_40px_rgba(124,109,250,0.3)]">
          <span className="display text-2xl font-extrabold">A</span>
        </div>
        <motion.h1
          className="display text-4xl font-extrabold tracking-[0.14em]"
          initial={{ letterSpacing: '0.3em' }}
          animate={{ letterSpacing: '0.14em' }}
          transition={{ duration: 0.8 }}
        >
          AXON
        </motion.h1>
        <motion.p className="mono mt-3 text-[11px] tracking-[0.2em] text-slate-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
          NEURAL CONTENT INTELLIGENCE
        </motion.p>
      </motion.div>
    </div>
  )
}
