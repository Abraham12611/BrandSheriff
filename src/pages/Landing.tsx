import { useEffect, useRef, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAction, useQuery, useConvexAuth } from 'convex/react'
import { SignInButton, SignUpButton } from '@clerk/react'
import { api } from '../../convex/_generated/api'
import Loading from '../components/Loading'
import BrandMark from '../components/BrandMark'
import { ScanSearch, Lock, ArrowRight, Search } from 'lucide-react'

type Suspect = {
  url: string
  host: string
  title: string | null
  description: string | null
  platform: string
}

const STAGES = ['Scraping your site…', 'Extracting brand signals…', 'Searching for copies…']

export default function Landing() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const runScan = useAction(api.scans.run)
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [cached, setCached] = useState(false)
  const stageTimer = useRef<number | null>(null)

  const result = useQuery(api.scans.getByToken, token ? { token } : 'skip') as
    | { domain: string; scannedBrand: string | null; suspects: Suspect[]; scannedAt: number }
    | null
    | undefined

  useEffect(() => {
    if (!busy) return
    stageTimer.current = window.setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 2500)
    return () => {
      if (stageTimer.current) window.clearInterval(stageTimer.current)
    }
  }, [busy])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loading />
      </div>
    )
  }
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!url.trim() || busy) return
    setBusy(true)
    setStage(0)
    setError(null)
    setToken(null)
    try {
      const res = await runScan({ url: url.trim() })
      setToken(res.token)
      setCached(res.cached)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed — try again')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-neutral-900 flex flex-col">
      <header className="h-14 border-b border-neutral-200/60 flex items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="font-semibold tracking-tight">BrandSheriff</span>
        </div>
        <SignInButton mode="modal">
          <button className="text-sm font-medium text-neutral-700 hover:text-neutral-900 px-3 py-1.5">
            Sign in
          </button>
        </SignInButton>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-16">
        <div className="w-full max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600 bg-neutral-100 border border-neutral-200 rounded-full px-3 py-1 mb-6">
            <ScanSearch className="w-3.5 h-3.5" /> Live scan · real results · no account needed
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
            Find out who's copying your brand.
          </h1>
          <p className="text-neutral-600 mt-4 text-base sm:text-lg max-w-xl mx-auto">
            BrandSheriff patrols the web for copycats, counterfeits, and unauthorized use —
            then helps you prove it, report it, and verify it's gone.
          </p>

          <form onSubmit={submit} className="mt-8 flex items-center gap-2 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="yourstore.com"
                inputMode="url"
                className="input-field w-full !pl-10 !py-3 !rounded-full text-sm"
                disabled={busy}
              />
            </div>
            <button
              type="submit"
              disabled={busy || !url.trim()}
              className="btn-primary !rounded-full !py-3 px-6 shrink-0"
            >
              {busy ? 'Scanning…' : 'Scan'}
            </button>
          </form>

          {busy && (
            <p className="text-sm text-neutral-500 mt-4 animate-pulse">{STAGES[stage]}</p>
          )}
          {error && (
            <div className="mt-4 max-w-lg mx-auto text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {result && Array.isArray(result.suspects) && (
            <div className="mt-8 max-w-xl mx-auto text-left">
              <div className="app-panel p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">
                    {result.suspects.length === 0
                      ? 'No suspected copies surfaced'
                      : `${result.suspects.length} suspected ${result.suspects.length === 1 ? 'copy' : 'copies'} found`}
                  </h2>
                  {cached && (
                    <span className="text-[11px] text-neutral-500 shrink-0">
                      cached result · scanned {new Date(result.scannedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {result.domain}
                  {result.scannedBrand ? ` · matched on "${result.scannedBrand}"` : ''}
                </p>

                {result.suspects.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {result.suspects.slice(0, 3).map((s) => (
                      <div
                        key={s.url}
                        className="relative rounded-xl border border-neutral-200 p-3.5 overflow-hidden"
                      >
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-neutral-900 truncate">{s.host}</p>
                            <p className="text-xs text-neutral-500 truncate blur-[5px] select-none">
                              {s.url}
                            </p>
                            {s.title && (
                              <p className="text-xs text-neutral-600 mt-1 truncate">{s.title}</p>
                            )}
                          </div>
                          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 capitalize shrink-0">
                            {s.platform}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-white/80 pointer-events-none" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-medium text-neutral-500">
                          <Lock className="w-3 h-3" /> Sign up to reveal
                        </div>
                      </div>
                    ))}
                    {result.suspects.length > 3 && (
                      <p className="text-xs text-neutral-500 text-center pt-1">
                        +{result.suspects.length - 3} more in the full report
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-5 pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center gap-3">
                  <p className="text-xs text-neutral-600 flex-1 text-center sm:text-left">
                    These results are real — the scan just ran live. Create a workspace to see
                    full URLs, run forensics, and start enforcement.
                  </p>
                  <SignUpButton mode="modal">
                    <button className="btn-primary text-sm shrink-0">
                      Create free workspace <ArrowRight className="w-4 h-4" />
                    </button>
                  </SignUpButton>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-neutral-400 mt-8">
            Evaluating BrandSheriff?{' '}
            <Link to="/dashboard" className="underline hover:text-neutral-600">
              Sign in
            </Link>{' '}
            and paste the demo storefront URL above to watch the full pipeline run.
          </p>
        </div>
      </main>
    </div>
  )
}
