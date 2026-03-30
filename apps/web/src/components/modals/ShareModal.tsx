import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  shareUrl: string | null
}

export function ShareModal({ open, onClose, shareUrl }: Props) {
  const copyLink = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    toast.success('Share link copied')
  }

  return (
    <Modal open={open} onClose={onClose} title="Share report">
      <p className="mb-3 text-sm text-slate-400">Anyone with this link can view a read-only version for 7 days.</p>
      <div className="rounded-xl border border-white/10 bg-black/30 p-3 mono text-xs text-slate-300">{shareUrl ?? 'Generate a share link first'}</div>
      <Button className="mt-4" fullWidth onClick={copyLink} disabled={!shareUrl}>
        <Copy size={16} /> Copy link
      </Button>
    </Modal>
  )
}
