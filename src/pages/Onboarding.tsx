import { useState } from 'react'
import { useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'

export default function Onboarding() {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const create = useMutation(api.brands.create)
  const crawl = useAction(api.brandDna.crawl)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const brandId = await create({ name, canonicalDomain: domain })
      await crawl({ brandId, url: domain })
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg border border-neutral-200 p-8">
      <h1 className="text-2xl font-bold">Onboard your brand</h1>
      <p className="text-neutral-600 mt-2">Add the official brand so BrandSheriff can build your Brand DNA.</p>

      {done ? (
        <div className="mt-6 p-4 bg-emerald-50 text-emerald-700 rounded-md">
          Brand created. Go to <a href="/brand" className="underline">Brand DNA</a> to review extracted assets.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Brand name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="Northstar Atelier"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Official domain</label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="https://northstaratelier.com"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Build Brand DNA'}
          </button>
        </form>
      )}
    </div>
  )
}
