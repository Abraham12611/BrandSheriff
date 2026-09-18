import { useState } from 'react'
import { useAction, useMutation } from 'convex/react'
import { Bell, Building2, Mail, Plug, Save } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import EnableProviderActions from '../components/EnableProviderActions'

export default function Settings() {
  const { organization, isAdmin, membership, providerActionsEnabled } = useWorkspace()
  const updateSettings = useMutation(api.organizations.updateSettings)
  const updatePrefs = useMutation(api.memberships.updateNotificationPrefs)
  const provisionMailbox = useAction(api.mailProvision.provision)

  const [name, setName] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  if (!organization || !membership) return <Loading message="Loading settings…" />

  const orgId = organization._id
  const prefs = (membership.notificationPrefs ?? {}) as Record<string, boolean>

  const flash = (key: string) => {
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  const saveName = async () => {
    const next = (name ?? organization.name).trim()
    if (!next || next === organization.name) return
    setBusy('name')
    try {
      await updateSettings({ organizationId: orgId, name: next })
      setName(null)
      flash('name')
    } finally {
      setBusy(null)
    }
  }

  const togglePref = async (key: string, value: boolean) => {
    await updatePrefs({
      organizationId: orgId,
      prefs: { ...prefs, [key]: value },
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Workspace settings" subtitle={organization.name} />

      <section className="app-panel overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-neutral-500" />
          <h2 className="font-medium text-sm">Workspace</h2>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-neutral-500">Workspace name</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                value={name ?? organization.name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isAdmin}
                className="input-field flex-1"
              />
              {isAdmin && (
                <button
                  onClick={saveName}
                  disabled={busy !== null || (name ?? organization.name).trim() === organization.name}
                  className="btn-secondary text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saved === 'name' ? 'Saved' : busy === 'name' ? 'Saving…' : 'Save'}
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs text-neutral-500">
            <div>
              <span className="text-neutral-400">Slug</span>
              <p className="font-mono text-neutral-700 mt-0.5">{organization.slug}</p>
            </div>
            <div>
              <span className="text-neutral-400">Your role</span>
              <p className="text-neutral-700 mt-0.5 capitalize">{membership.role}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="app-panel overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
          <Plug className="w-4 h-4 text-neutral-500" />
          <h2 className="font-medium text-sm">Provider actions</h2>
        </div>
        <div className="p-4">
          <p className="text-xs text-neutral-500 leading-relaxed mb-3">
            Provider actions call paid third-party services — Firecrawl (crawling),
            OpenAI (analysis and drafting), AgentMail (sending). They're off by
            default and can only be enabled by an owner or admin.
          </p>
          {providerActionsEnabled ? (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              Provider actions are enabled for this workspace.
            </p>
          ) : (
            <EnableProviderActions />
          )}
        </div>
      </section>

      <section className="app-panel overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
          <Mail className="w-4 h-4 text-neutral-500" />
          <h2 className="font-medium text-sm">Enforcement mailbox</h2>
        </div>
        <div className="p-4">
          {organization.mailboxAddress ? (
            <div className="text-xs space-y-1.5">
              <p className="text-neutral-700">
                Inbound/outbound address:{' '}
                <span className="font-mono">{organization.mailboxAddress}</span>
              </p>
              <p className="text-neutral-400">
                Replies to sent notices and platform responses land on the case
                timeline via the AgentMail webhook.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-neutral-500">
                No AgentMail inbox provisioned — required to send enforcement
                notices and receive replies.
              </p>
              <button
                onClick={async () => {
                  setBusy('mailbox')
                  try {
                    await provisionMailbox({ organizationId: orgId })
                  } finally {
                    setBusy(null)
                  }
                }}
                disabled={busy !== null || !isAdmin || !providerActionsEnabled}
                className="btn-secondary text-xs"
                title={
                  !providerActionsEnabled
                    ? 'Enable provider actions first'
                    : !isAdmin
                      ? 'Admins only'
                      : undefined
                }
              >
                {busy === 'mailbox' ? 'Provisioning…' : 'Provision mailbox'}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="app-panel overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
          <Bell className="w-4 h-4 text-neutral-500" />
          <h2 className="font-medium text-sm">Your notifications</h2>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-neutral-500">
            Alert emails are sent from the workspace mailbox to members.
            Owners/admins always receive urgent alerts; other members get them
            unless they opt out here.
          </p>
          {[
            { key: 'alerts', label: 'Urgent discovery alerts', desc: 'Exact image matches, high-severity patrol findings' },
            { key: 'digest', label: 'Weekly digest', desc: 'New discoveries, case movement, takedown outcomes' },
          ].map((row) => (
            <label key={row.key} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs[row.key] !== false}
                onChange={(e) => togglePref(row.key, e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="text-sm text-neutral-800 block">{row.label}</span>
                <span className="text-xs text-neutral-400">{row.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}
