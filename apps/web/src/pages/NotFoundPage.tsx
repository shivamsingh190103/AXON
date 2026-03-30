import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <h1 className="display text-4xl font-extrabold">Page not found</h1>
        <p className="mt-2 text-slate-400">The page you are looking for does not exist.</p>
        <Link className="focus-ring mt-5 inline-block rounded-xl bg-[var(--primary)] px-4 py-2" to="/dashboard">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
