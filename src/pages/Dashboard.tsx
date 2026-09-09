import { useState } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'

export default function Dashboard() {
  const brands = useQuery(api.brands.list)
  const discoveries = useQuery(api.discoveries.listByStatus, { status: 'needs_review' })
  const cases = useQuery(api.cases.listByState, { state: 'active' })
  const loadDemo = useMutation(api.seed.loadDemoWorkspace)
  const crawl = useAction(api.brandDna.crawl)
  const [seeding, setSeeding] = useState(false)

  const handleLoadDemo = async () => {
    setSeeding(true)
    try {
      const demoBaseUrl = import.meta.env.VITE_CONVEX_SITE_URL || window.location.origin
      const { brandId } = await loadDemo({ demoBaseUrl })
      await crawl({ brandId, url: `${demoBaseUrl}/demo/northstar/` })
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Command Center</h1>
        <p className="text-neutral-600 mt-1">Real-time overview of your brand defense operations.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Brands monitored" value={brands?.length ?? 0} />
        <KpiCard label="Needs review" value={discoveries?.length ?? 0} tone="warning" />
        <KpiCard label="Active cases" value={cases?.length ?? 0} tone="danger" />
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h2 className="font-semibold mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/onboarding" className="px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium hover:bg-neutral-800">
            Onboard a brand
          </a>
          <a href="/patrols" className="px-4 py-2 bg-white border border-neutral-300 rounded-md text-sm font-medium hover:bg-neutral-50">
            Run patrol
          </a>
          <a href="/cases" className="px-4 py-2 bg-white border border-neutral-300 rounded-md text-sm font-medium hover:bg-neutral-50">
            View cases
          </a>
          <button
            onClick={handleLoadDemo}
            disabled={seeding}
            className="px-4 py-2 bg-amber-500 text-neutral-900 rounded-md text-sm font-medium hover:bg-amber-400 disabled:opacity-50"
          >
            {seeding ? 'Loading demo...' : 'Load Northstar demo'}
          </button>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, tone }: { label: string; value: number; tone?: 'neutral' | 'warning' | 'danger' }) {
  const toneClasses = {
    neutral: 'bg-white border-neutral-200',
    warning: 'bg-amber-50 border-amber-200',
    danger: 'bg-rose-50 border-rose-200',
  }
  return (
    <div className={`rounded-lg border p-5 ${toneClasses[tone ?? 'neutral']}`}>
      <div className="text-sm text-neutral-600">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  )
}
