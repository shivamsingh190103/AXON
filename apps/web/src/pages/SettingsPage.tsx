import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/stores/authStore'

const tabs = ['Account', 'Plan & Billing', 'Notifications', 'Danger Zone'] as const

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<(typeof tabs)[number]>('Account')

  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="flex">
        <Sidebar />
        <main className="w-full p-4 pb-24 lg:p-6 lg:pb-6">
          <h1 className="display text-3xl font-extrabold">Settings</h1>

          <div className="mt-4 flex flex-wrap gap-2">
            {tabs.map((item) => (
              <button key={item} className={`focus-ring rounded-xl px-3 py-2 text-sm ${tab === item ? 'bg-[var(--primary)]/25 text-white' : 'bg-white/5 text-slate-300'}`} onClick={() => setTab(item)}>
                {item}
              </button>
            ))}
          </div>

          {tab === 'Account' ? (
            <section className="mt-6 max-w-xl rounded-2xl border border-white/10 bg-[#0b0b16] p-5">
              <label className="mb-2 block text-sm text-slate-300">Name</label>
              <Input defaultValue={user?.name ?? ''} />
              <label className="mb-2 mt-4 block text-sm text-slate-300">Email</label>
              <Input value={user?.email ?? ''} disabled />
              <Button className="mt-5">Save changes</Button>
            </section>
          ) : null}

          {tab === 'Plan & Billing' ? (
            <section className="mt-6 rounded-2xl border border-white/10 bg-[#0b0b16] p-5">
              <p className="text-sm text-slate-300">Current plan: {user?.plan}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[{ title: 'FREE', price: '₹0/mo' }, { title: 'CREATOR', price: '₹999/mo' }, { title: 'PRO', price: '₹2499/mo' }].map((plan) => (
                  <div key={plan.title} className={`rounded-xl border p-4 ${user?.plan === plan.title ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-white/10'}`}>
                    <p className="display text-xl font-bold">{plan.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{plan.price}</p>
                    <Button className="mt-3" variant={user?.plan === plan.title ? 'secondary' : 'primary'}>
                      {user?.plan === plan.title ? 'Current plan' : 'Upgrade'}
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {tab === 'Notifications' ? (
            <section className="mt-6 rounded-2xl border border-white/10 bg-[#0b0b16] p-5 text-sm text-slate-300">
              <label className="mb-3 flex items-center gap-2"><input type="checkbox" defaultChecked /> Email when analysis completes</label>
              <label className="mb-3 flex items-center gap-2"><input type="checkbox" /> Email weekly usage summary</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Product updates and tips</label>
            </section>
          ) : null}

          {tab === 'Danger Zone' ? (
            <section className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-sm text-rose-100">
              <p className="mb-3">Delete account or export your data.</p>
              <div className="flex gap-2">
                <Button variant="danger">Delete account</Button>
                <Button variant="ghost">Export all data</Button>
              </div>
            </section>
          ) : null}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
