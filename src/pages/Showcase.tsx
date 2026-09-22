import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import Loading from '../components/Loading'
import BrandMark from '../components/BrandMark'
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Radar,
  Briefcase,
  Network,
  Landmark,
  ArrowRight,
} from 'lucide-react'

type Signal = { signal: string; finding: string; weight: number; severity: string }
type Discovery = {
  _id: string
  canonicalUrl: string
  title?: string
  status: string
  severity?: string
  summary?: string
  matchConfidence?: number
  authorizationRisk?: number
  platformGuess?: string
  visualMatchScore?: number
  cloneScore?: number
  matchedQuery?: string
  source?: string
  suspectImageUrl: string | null
  matchedAssetTitle: string | null
  assetImageUrl: string | null
  signals: Signal[]
}
type Action = {
  _id: string
  route: string
  channel: string
  basis: string
  status: string
  confidence: string
  reason: string
  submissionUrl?: string
  requiredFields?: string[]
}
type Case = {
  _id: string
  caseNumber: string
  title: string
  state: string
  severity?: string
  summary?: string
  discoveryUrl: string | null
  actions: Action[]
  packets: { routeType: string; status: string; excerpt: string }[]
}
type Offender = {
  _id: string
  label: string
  status: string
  maxCloneScore?: number
  linkedDiscoveries: number
  matchTypes: string[]
}
type Showcase = {
  workspace: { name: string; mailboxAddress?: string }
  brand: {
    name: string
    canonicalDomain: string
    description?: string
    brandDnaStatus: string
  } | null
  stats: {
    discoveries: number
    cases: number
    enforcementActions: number
    offenders: number
    rights: number
  }
  discoveries: Discovery[]
  cases: Case[]
  offenders: Offender[]
  rights: { kind: string; label: string; value?: string; territory?: string; status: string }[]
}

const host = (url: string) => {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

const scoreTone = (n?: number) =>
  n == null
    ? 'bg-neutral-100 text-neutral-500'
    : n >= 70
      ? 'bg-red-100 text-red-700'
      : n >= 40
        ? 'bg-amber-100 text-amber-700'
        : 'bg-emerald-100 text-emerald-700'

const statusTone: Record<string, string> = {
  needs_review: 'bg-amber-100 text-amber-700',
  case_created: 'bg-blue-100 text-blue-700',
  approved: 'bg-red-100 text-red-700',
  denied: 'bg-neutral-100 text-neutral-600',
  watchlisted: 'bg-purple-100 text-purple-700',
  recommended: 'bg-neutral-100 text-neutral-600',
  prepared: 'bg-blue-100 text-blue-700',
  submitted: 'bg-indigo-100 text-indigo-700',
  platform_reviewing: 'bg-purple-100 text-purple-700',
  actioned: 'bg-emerald-100 text-emerald-700',
  counter_notice: 'bg-red-100 text-red-700',
  suspected: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-red-100 text-red-700',
}

const Badge = ({ label, tone }: { label: string; tone?: string }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${tone ?? 'bg-neutral-100 text-neutral-600'}`}
  >
    {label.replace(/_/g, ' ')}
  </span>
)

function DiscoveryCard({ d }: { d: Discovery }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge label={d.status} tone={statusTone[d.status]} />
              {d.severity && <Badge label={d.severity} tone="bg-red-100 text-red-700" />}
              {d.platformGuess && <Badge label={d.platformGuess} />}
            </div>
            <h3 className="mt-2 font-semibold text-neutral-900 truncate">
              {d.title || host(d.canonicalUrl)}
            </h3>
            <a
              href={d.canonicalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 truncate max-w-full"
            >
              {d.canonicalUrl} <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
          {d.cloneScore != null && (
            <div className="text-center shrink-0">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${scoreTone(d.cloneScore)}`}
              >
                {d.cloneScore}
              </div>
              <div className="text-[10px] text-neutral-500 mt-1">clone risk</div>
            </div>
          )}
        </div>

        {d.summary && <p className="mt-3 text-sm text-neutral-600 line-clamp-3">{d.summary}</p>}

        {(d.suspectImageUrl || d.assetImageUrl) && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {d.assetImageUrl && (
              <figure>
                <img
                  src={d.assetImageUrl}
                  alt="Original asset"
                  className="rounded-lg border border-neutral-200 object-cover aspect-square w-full"
                />
                <figcaption className="text-[10px] text-neutral-500 mt-1">
                  Original · {d.matchedAssetTitle ?? 'brand asset'}
                </figcaption>
              </figure>
            )}
            {d.suspectImageUrl && (
              <figure>
                <img
                  src={d.suspectImageUrl}
                  alt="Suspect copy"
                  className="rounded-lg border border-neutral-200 object-cover aspect-square w-full"
                />
                <figcaption className="text-[10px] text-neutral-500 mt-1">
                  Suspect · visual match{' '}
                  {d.visualMatchScore != null ? `${Math.round(d.visualMatchScore * 100)}%` : ''}
                </figcaption>
              </figure>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center gap-4 text-[11px] text-neutral-500 flex-wrap">
          {d.matchedQuery && <span>query “{d.matchedQuery}”</span>}
          {d.matchConfidence != null && (
            <span>identity similarity {Math.round(d.matchConfidence * 100)}%</span>
          )}
          {d.authorizationRisk != null && (
            <span>authorization risk {Math.round(d.authorizationRisk * 100)}%</span>
          )}
        </div>
      </div>

      {d.signals.length > 0 && (
        <>
          <button
            onClick={() => setOpen(!open)}
            className="w-full px-5 py-2.5 bg-neutral-50 border-t border-neutral-200 text-xs font-medium text-neutral-600 flex items-center justify-between hover:bg-neutral-100"
          >
            Why {d.cloneScore ?? 0}/100? · {d.signals.length} explainable signals
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {open && (
            <table className="w-full text-xs">
              <tbody>
                {d.signals.map((s, i) => (
                  <tr key={i} className="border-t border-neutral-100">
                    <td className="px-5 py-2 font-medium text-neutral-700 w-48">
                      {s.signal.replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-2 text-neutral-600">{s.finding}</td>
                    <td className="px-5 py-2 text-right text-neutral-500 w-16">+{s.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}

function CaseCard({ c }: { c: Case }) {
  const [packetOpen, setPacketOpen] = useState<number | null>(null)
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-500">{c.caseNumber}</span>
            <Badge label={c.state} tone={statusTone[c.state] ?? 'bg-blue-100 text-blue-700'} />
            {c.severity && <Badge label={c.severity} tone="bg-red-100 text-red-700" />}
          </div>
          <h3 className="mt-1.5 font-semibold text-neutral-900">{c.title}</h3>
          {c.summary && <p className="mt-1 text-sm text-neutral-600">{c.summary}</p>}
        </div>
        <span className="text-xs text-neutral-500">{c.actions.length} enforcement routes</span>
      </div>

      <div className="mt-4 space-y-2">
        {c.actions.map((a) => (
          <div
            key={a._id}
            className="flex items-center justify-between gap-3 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-neutral-800">
                  {a.route.replace(/_/g, ' ')}
                </span>
                <Badge label={a.channel} />
                <Badge label={a.basis} />
                <Badge label={`${a.confidence} confidence`} />
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">{a.reason}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge label={a.status} tone={statusTone[a.status]} />
              {a.submissionUrl && (
                <a
                  href={a.submissionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                  title="Official submission channel"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {c.packets.length > 0 && (
        <div className="mt-4">
          {c.packets.map((p, i) => (
            <div key={i} className="border border-neutral-100 rounded-lg mb-2">
              <button
                onClick={() => setPacketOpen(packetOpen === i ? null : i)}
                className="w-full px-3 py-2 text-xs font-medium text-neutral-600 flex items-center justify-between hover:bg-neutral-50"
              >
                Prepared packet · {p.routeType.replace(/_/g, ' ')} · {p.status}
                {packetOpen === i ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {packetOpen === i && (
                <pre className="px-4 py-3 text-[11px] text-neutral-700 whitespace-pre-wrap border-t border-neutral-100 bg-neutral-50 max-h-64 overflow-auto">
                  {p.excerpt}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Showcase() {
  const data = useQuery(api.demoShowcase.getShowcase) as Showcase | null | undefined

  if (data === undefined) return <Loading />

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-neutral-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3">
            <BrandMark className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">BrandSheriff</h1>
              <p className="text-neutral-400 text-sm">
                Live demo workspace · {data?.workspace.name ?? 'not seeded yet'}
              </p>
            </div>
            <span className="ml-auto px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold">
              LIVE DATA
            </span>
          </div>
          <p className="mt-4 max-w-3xl text-neutral-300 text-sm leading-relaxed">
            Everything below is real output from the running product: Firecrawl crawled the
            controlled demo storefronts, OpenAI produced the comparisons and packets, and every
            score, signal and enforcement route was computed by the live pipeline — not mocked.
            Scores are explainable triage signals, never legal conclusions.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {!data ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-10 text-center">
            <Radar className="w-10 h-10 text-neutral-300 mx-auto" />
            <h2 className="mt-4 font-semibold text-neutral-900">Demo workspace not seeded yet</h2>
            <p className="mt-2 text-sm text-neutral-500">
              The public demo data hasn't been generated for this deployment.
            </p>
          </div>
        ) : (
          <>
            {data.brand && (
              <section className="bg-white rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900">{data.brand.name}</h2>
                    <p className="text-sm text-neutral-500">{data.brand.description}</p>
                    <a
                      href={data.brand.canonicalDomain}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      {data.brand.canonicalDomain} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex gap-6 text-center">
                    {[
                      ['Discoveries', data.stats.discoveries],
                      ['Cases', data.stats.cases],
                      ['Enforcement routes', data.stats.enforcementActions],
                      ['Offender ops', data.stats.offenders],
                      ['Rights records', data.stats.rights],
                    ].map(([label, n]) => (
                      <div key={label}>
                        <div className="text-2xl font-bold text-neutral-900">{n}</div>
                        <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section>
              <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900 mb-4">
                <Radar className="w-5 h-5 text-neutral-400" /> Patrol discoveries
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {data.discoveries.map((d) => (
                  <DiscoveryCard key={d._id} d={d} />
                ))}
              </div>
            </section>

            {data.cases.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900 mb-4">
                  <Briefcase className="w-5 h-5 text-neutral-400" /> Enforcement pipeline
                </h2>
                <div className="space-y-4">
                  {data.cases.map((c) => (
                    <CaseCard key={c._id} c={c} />
                  ))}
                </div>
              </section>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {data.offenders.length > 0 && (
                <section>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900 mb-4">
                    <Network className="w-5 h-5 text-neutral-400" /> Offender networks
                  </h2>
                  <div className="space-y-3">
                    {data.offenders.map((o) => (
                      <div
                        key={o._id}
                        className="bg-white rounded-xl border border-neutral-200 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-900 text-sm">{o.label}</span>
                          <Badge label={o.status} tone={statusTone[o.status]} />
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-[11px] text-neutral-500">
                          <span>{o.linkedDiscoveries} linked discoveries</span>
                          {o.maxCloneScore != null && <span>max clone risk {o.maxCloneScore}</span>}
                          <span>{o.matchTypes.map((t) => t.replace(/_/g, ' ')).join(' · ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {data.rights.length > 0 && (
                <section>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-neutral-900 mb-4">
                    <Landmark className="w-5 h-5 text-neutral-400" /> Rights vault
                  </h2>
                  <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
                    {data.rights.map((r, i) => (
                      <div key={i} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-neutral-800">{r.label}</div>
                          <div className="text-[11px] text-neutral-500">
                            {r.kind.replace(/_/g, ' ')}
                            {r.territory ? ` · ${r.territory}` : ''}
                            {r.value ? ` · ${r.value}` : ''}
                          </div>
                        </div>
                        <Badge label={r.status} />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <section className="bg-neutral-900 rounded-xl p-8 text-center">
              <h2 className="text-xl font-bold text-white">Run it on your own brand</h2>
              <p className="mt-2 text-sm text-neutral-400 max-w-xl mx-auto">
                Create a workspace, point it at your official site, and BrandSheriff starts
                discovering, scoring and routing suspected copies through real enforcement
                channels.
              </p>
              <Link
                to="/"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-neutral-900 rounded-lg text-sm font-semibold hover:bg-amber-300"
              >
                Start a free scan <ArrowRight className="w-4 h-4" />
              </Link>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
