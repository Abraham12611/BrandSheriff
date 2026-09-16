import { useParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Loading from '../components/Loading'
import { Shield, Printer, FileWarning } from 'lucide-react'

type Snapshot = {
  generatedAt: number
  organizationName: string
  brandName?: string
  headline: {
    discoveriesFound: number
    needsReview: number
    approved: number
    denied: number
    watchlisted: number
    casesOpened: number
    casesResolved: number
    noticesSent: number
    verifiedRemovals: number
    avgSimilarity: number | null
  }
  channels: { platform: string; count: number }[]
  topOffenders: {
    url: string
    host: string
    platform: string
    similarity: number | null
    status: string
  }[]
  resolvedCases: {
    caseNumber: string
    title: string
    resolvedAt: number
    state: string
  }[]
}

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

const pct = (n: number | null) => (n === null ? '—' : `${Math.round(n * 100)}%`)

export default function ReportView() {
  const { token } = useParams<{ token: string }>()
  const report = useQuery(api.reports.getByToken, token ? { token } : 'skip') as
    | {
        title: string
        rangeFrom: number
        rangeTo: number
        sections: string[]
        snapshot: Snapshot
        brandName: string | null
        createdAt: number
      }
    | null
    | undefined

  if (report === undefined) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  if (report === null) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white rounded-2xl border border-neutral-200 p-10">
          <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto">
            <FileWarning className="w-5 h-5 text-neutral-500" />
          </div>
          <h1 className="text-lg font-semibold text-neutral-900 mt-4">Report unavailable</h1>
          <p className="text-sm text-neutral-600 mt-2">
            This report link is invalid or has been revoked by the workspace that created it.
          </p>
        </div>
      </div>
    )
  }

  const s = report.snapshot
  const has = (key: string) => report.sections.includes(key)
  const maxChannel = Math.max(1, ...s.channels.map((c) => c.count))

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-4 print:bg-white print:py-0 print:px-0">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-end mb-4 print:hidden">
          <button onClick={() => window.print()} className="btn-secondary text-sm">
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>

        <article className="bg-white rounded-2xl border border-neutral-200 overflow-hidden print:border-0 print:rounded-none">
          <header className="px-8 pt-8 pb-6 border-b border-neutral-100">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold tracking-tight text-neutral-900">BrandSheriff</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{report.title}</h1>
            <p className="text-sm text-neutral-600 mt-1.5">
              {s.organizationName}
              {report.brandName ? ` · ${report.brandName}` : ' · All brands'}
            </p>
            <p className="text-sm text-neutral-500 mt-0.5">
              {fmtDate(report.rangeFrom)} – {fmtDate(report.rangeTo)} · Generated{' '}
              {fmtDate(s.generatedAt)}
            </p>
          </header>

          {has('headline') && (
            <section className="px-8 py-6 border-b border-neutral-100">
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500 mb-4">
                Headline metrics
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Metric label="Suspects found" value={s.headline.discoveriesFound} />
                <Metric label="Approved" value={s.headline.approved} />
                <Metric label="Denied" value={s.headline.denied} />
                <Metric label="Watchlisted" value={s.headline.watchlisted} />
                <Metric label="Cases opened" value={s.headline.casesOpened} />
                <Metric label="Cases resolved" value={s.headline.casesResolved} />
                <Metric label="Notices sent" value={s.headline.noticesSent} />
                <Metric label="Verified removals" value={s.headline.verifiedRemovals} />
              </div>
              <p className="text-xs text-neutral-500 mt-3">
                Avg. similarity of scored suspects: {pct(s.headline.avgSimilarity)} ·{' '}
                {s.headline.needsReview} still awaiting review at generation time.
              </p>
            </section>
          )}

          {has('channels') && (
            <section className="px-8 py-6 border-b border-neutral-100">
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500 mb-4">
                Where suspects appeared
              </h2>
              {s.channels.length === 0 ? (
                <p className="text-sm text-neutral-500">No suspects found in this period.</p>
              ) : (
                <div className="space-y-2">
                  {s.channels.map((c) => (
                    <div key={c.platform} className="flex items-center gap-3">
                      <span className="w-28 text-xs font-medium text-neutral-700 capitalize truncate">
                        {c.platform}
                      </span>
                      <div className="flex-1 h-5 bg-neutral-100 rounded-md overflow-hidden">
                        <div
                          className="h-full bg-neutral-800 rounded-md"
                          style={{ width: `${(c.count / maxChannel) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs font-semibold text-neutral-900">
                        {c.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {has('top_offenders') && (
            <section className="px-8 py-6 border-b border-neutral-100">
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500 mb-4">
                Highest-similarity suspects
              </h2>
              {s.topOffenders.length === 0 ? (
                <p className="text-sm text-neutral-500">No open suspects in this period.</p>
              ) : (
                <div className="divide-y divide-neutral-100 -mx-8">
                  {s.topOffenders.map((o) => (
                    <div key={o.url} className="px-8 py-3 flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900 truncate">{o.host}</p>
                        <p className="text-xs text-neutral-500 truncate">{o.url}</p>
                      </div>
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 capitalize shrink-0">
                        {o.platform}
                      </span>
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 shrink-0">
                        {o.status.replace('_', ' ')}
                      </span>
                      <span className="w-12 text-right text-sm font-semibold text-neutral-900 shrink-0">
                        {pct(o.similarity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {has('resolved_cases') && (
            <section className="px-8 py-6 border-b border-neutral-100">
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500 mb-4">
                Cases resolved in period
              </h2>
              {s.resolvedCases.length === 0 ? (
                <p className="text-sm text-neutral-500">No cases resolved in this period.</p>
              ) : (
                <div className="divide-y divide-neutral-100 -mx-8">
                  {s.resolvedCases.map((c) => (
                    <div key={c.caseNumber} className="px-8 py-3 flex items-center gap-4">
                      <span className="text-xs font-mono font-semibold text-neutral-500 shrink-0">
                        {c.caseNumber}
                      </span>
                      <p className="text-sm font-medium text-neutral-900 truncate flex-1">
                        {c.title}
                      </p>
                      <span className="text-xs text-neutral-500 shrink-0">
                        {fmtDate(c.resolvedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="px-8 py-6 bg-neutral-50">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500 mb-3">
              Methodology
            </h2>
            <div className="text-xs text-neutral-600 leading-relaxed space-y-2">
              <p>
                Suspects are discovered by automated patrols searching for brand assets, product
                names, and keywords across the web, plus manual reports. Each suspect is compared
                against the brand's official asset library using automated similarity signals
                (visual, textual, and metadata overlap).
              </p>
              <p>
                <strong className="text-neutral-800">
                  Similarity scores are machine-generated comparison signals, not legal conclusions.
                </strong>{' '}
                All enforcement actions in this report were reviewed and approved by a human before
                being sent. "Verified removals" means a re-check confirmed the reported page was no
                longer available at check time.
              </p>
              <p className="text-neutral-400 pt-1">
                Generated by BrandSheriff · This link can be revoked by the issuing workspace.
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-neutral-200 px-3.5 py-3">
      <div className="text-xl font-bold tracking-tight text-neutral-900 tabular-nums">{value}</div>
      <div className="text-[11px] text-neutral-500 mt-0.5">{label}</div>
    </div>
  )
}
