import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { loginSchema } from '@axon/shared'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { shakeVariants } from '@/lib/animations'

interface LoginFormValues {
  email: string
  password: string
}

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [shake, setShake] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur'
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await api.post('/auth/login', values)
      const payload = response.data?.data
      setAuth(payload.user, payload.accessToken)
      toast.success('Welcome back')
      navigate('/dashboard')
    } catch (error: unknown) {
      setShake(true)
      setTimeout(() => setShake(false), 450)
      const apiError = (error as { response?: { data?: { error?: { code?: string; message?: string } } } }).response?.data?.error
      const code = apiError?.code

      if (!apiError) {
        toast.error('Cannot reach server. Make sure API is running and try again.')
        return
      }

      if (code === 'INVALID_CREDENTIALS') {
        toast.error('Invalid credentials. Please try again.')
      } else if (code === 'CSRF_MISMATCH') {
        toast.error('Session check failed. Please refresh and try again.')
      } else if (code === 'DATABASE_UNAVAILABLE') {
        toast.error('Database is offline. Start PostgreSQL and retry.')
      } else if (code === 'DATABASE_SCHEMA_NOT_READY') {
        toast.error('Database schema is not ready. Run Prisma migrations and retry.')
      } else if (code === 'REDIS_UNAVAILABLE') {
        toast.error('Redis is offline. Start Redis and retry.')
      } else {
        toast.error(apiError.message ?? 'Connection error. Check your internet and try again.')
      }
    }
  })

  return (
    <div className="grid min-h-screen md:grid-cols-[640px_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-white/10 bg-[#08080f] p-10 md:flex md:flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_70%,rgba(124,109,250,0.08),transparent_50%)]" />
        <p className="display relative text-2xl font-extrabold tracking-[0.14em]">AXON</p>
        <motion.h1 className="display relative mt-16 text-5xl font-extrabold leading-tight text-white" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          {['See', 'what', 'your', 'audience', 'feels.'].map((word) => (
            <motion.span key={word} className="mr-3 inline-block" variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
              {word}
            </motion.span>
          ))}
        </motion.h1>
        <p className="relative mt-5 max-w-md text-sm leading-7 text-slate-400">
          Neural engagement scoring for video creators. Know exactly where attention drops before you publish.
        </p>
        <div className="relative mt-10 space-y-4">
          {[
            { label: 'HOOK', color: 'from-cyan-400/60 to-cyan-200/10' },
            { label: 'BOREDOM', color: 'from-rose-400/60 to-rose-200/10' },
            { label: 'EMOTION', color: 'from-amber-400/60 to-amber-200/10' }
          ].map((track, index) => (
            <div key={track.label}>
              <p className="mono mb-1 text-xs text-slate-500">{track.label}</p>
              <div className="h-3 overflow-hidden rounded bg-[#111220]">
                <div className={`h-full w-full bg-gradient-to-r ${track.color} animate-pulse`} style={{ animationDuration: `${2.4 + index * 0.5}s` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="relative mt-auto flex gap-2 pt-10">
          <span className="mono rounded-full border border-[#1c1c2e] bg-[#0e0e1a] px-3 py-1 text-[11px] text-slate-500">TRIBE v2 powered</span>
          <span className="mono rounded-full border border-[#1c1c2e] bg-[#0e0e1a] px-3 py-1 text-[11px] text-slate-500">1Hz resolution</span>
          <span className="mono rounded-full border border-[#1c1c2e] bg-[#0e0e1a] px-3 py-1 text-[11px] text-slate-500">No hardware</span>
        </div>
      </aside>

      <main className="grid place-items-center p-6">
        <motion.form
          className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b16] p-6"
          onSubmit={onSubmit}
          variants={shakeVariants}
          animate={shake ? 'shake' : undefined}
          style={{ opacity: isSubmitting ? 0.7 : 1 }}
        >
          <h2 className="display mb-1 text-3xl font-extrabold">Sign in</h2>
          <p className="mb-6 text-sm text-slate-400">Continue to your dashboard.</p>

          <label className="mb-2 block text-sm text-slate-300">Email address</label>
          <Input type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
          {errors.email?.message ? <p className="error-text">{errors.email.message}</p> : null}

          <label className="mb-2 mt-4 block text-sm text-slate-300">Password</label>
          <div className="relative">
            <Input type={showPassword ? 'text' : 'password'} autoComplete="current-password" {...register('password')} error={errors.password?.message} />
            <button className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" type="button" onClick={() => setShowPassword((prev) => !prev)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password?.message ? <p className="error-text">{errors.password.message}</p> : null}

          <div className="mt-2 text-right">
            <Link to="#" className="text-xs text-slate-400 hover:text-white">
              Forgot password?
            </Link>
          </div>

          <Button className="mt-5" fullWidth type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
            {isSubmitting ? 'Signing in...' : 'Continue'}
          </Button>

          <div className="my-4 flex items-center gap-2 text-xs text-slate-500">
            <div className="h-px flex-1 bg-white/10" />
            or
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <a href={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001'}/api/v1/auth/google`}>
            <Button variant="ghost" fullWidth type="button">
              Continue with Google
            </Button>
          </a>

          <p className="mt-5 text-center text-sm text-slate-400">
            New to AXON?{' '}
            <Link to="/register" className="text-violet-300 hover:text-violet-200">
              Start for free
            </Link>
          </p>
        </motion.form>
      </main>
    </div>
  )
}
