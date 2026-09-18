import { useQuery } from 'convex/react'
import { Gauge } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import { useWorkspace } from '../../lib/workspace'

const SEVERITY_DOT: Record<string, string> = {
  strong: 'bg-rose-500',
  medium: 'bg-amber-400',
  weak: 'bg-neutral-300',
}

const SIGNAL_LABEL: Record<string, string> = {
  product_image_match: 'Product images',
  brand_asset_match: 'Vault asset match',
  description_similarity: 'Text similarity',
  domain_impersonation: 'Domain pattern',
  repeat_offender: 'Repeat offender',
  keyword_attribution: 'Keyword match',
  marketplace_listing: 'Marketplace',
  social_account: 'Social platform',
  evidence_strength: 'Evidence',
  coverage_gap: 'Coverage gap',
}

/** Explainable clone-score breakdown — the "Signal / Finding" table from
 * the case detail spec. Every row is a factual observation feeding the
 * composite score. */
export default function SignalsPanel({
  discovery,
}: {
  discovery: Doc<'discoveries'> | null | undefined
}) {
  const { organization } = useWorkspace()
  const signals = useQuery(
    api.cloneScore.listSignals,
    discovery?._id && organization
      ? { discoveryId: discovery._id as Id<'discoveries'>, organizationId: organization._id }
      : 'skip',
  )

  if (!discovery || signals === undefined || signals.length === 0) return null

  const score = discovery.cloneScore ?? signals.reduce((s, x) => s + x.weight, 0)

  return (
    <section className="app-panel overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
        <Gauge className="w-4 h-4 text-neutral-500" />
        <h2 className="font-medium text-sm">Clone risk</h2>
        <span
          className={`badge font-bold ${
            score >= 70
              ? 'bg-rose-50 text-rose-700'
              : score >= 40
                ? 'bg-amber-50 text-amber-700'
                : 'bg-neutral-100 text-neutral-500'
          }`}
        >
          {score}/100
        </span>
        <span className="text-[11px] text-neutral-400 ml-auto">
          explainable signals, not a legal conclusion
        </span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-neutral-500 border-b border-neutral-100">
            <th className="px-4 py-2 font-medium w-40">Signal</th>
            <th className="px-4 py-2 font-medium">Finding</th>
            <th className="px-4 py-2 font-medium text-right w-16">Weight</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((s) => (
            <tr key={s._id} className="border-b border-neutral-50 last:border-0">
              <td className="px-4 py-2.5 text-neutral-700">
                <span className="inline-flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[s.severity] ?? 'bg-neutral-300'}`} />
                  {SIGNAL_LABEL[s.signal] ?? s.signal.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-4 py-2.5 text-neutral-600">{s.finding}</td>
              <td className="px-4 py-2.5 text-right font-mono text-neutral-400">
                {s.weight > 0 ? `+${s.weight}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
