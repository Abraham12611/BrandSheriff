import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import Modal from '../Modal'

export default function AddDiscoveryModal({
  open,
  onClose,
  brandId,
}: {
  open: boolean
  onClose: () => void
  brandId: Id<'brands'> | undefined
}) {
  const createManual = useMutation(api.discoveries.createManual)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<'created' | 'existed' | null>(null)

  const submit = async () => {
    if (!brandId || !url.trim()) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const res = await createManual({
        brandId,
        url: url.trim(),
        title: title.trim() || undefined,
        note: note.trim() || undefined,
      })
      setResult(res.existed ? 'existed' : 'created')
      if (!res.existed) {
        setUrl('')
        setTitle('')
        setNote('')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add discovery')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add discovery by URL"
      subtitle="Flag a suspect page directly — it lands in Needs Review."
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">
            Done
          </button>
          <button
            onClick={submit}
            disabled={busy || !url.trim() || !brandId}
            className="btn-primary"
          >
            {busy ? 'Adding…' : 'Add discovery'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="disc-url" className="block text-sm font-medium mb-1.5">
            Suspect URL <span className="text-rose-500">*</span>
          </label>
          <input
            id="disc-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://suspect-shop.example/product"
            className="input-field"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
        <div>
          <label htmlFor="disc-title" className="block text-sm font-medium mb-1.5">
            Title <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <input
            id="disc-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Suspect storefront"
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="disc-note" className="block text-sm font-medium mb-1.5">
            Note <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="disc-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why does this page look suspicious?"
            rows={3}
            className="input-field resize-none"
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {result === 'created' && (
          <p className="text-sm text-emerald-600">Added — it's now in Needs Review.</p>
        )}
        {result === 'existed' && (
          <p className="text-sm text-amber-600">That URL is already tracked.</p>
        )}
      </div>
    </Modal>
  )
}
