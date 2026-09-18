import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Mail, ShieldCheck, UserMinus, UserPlus } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useWorkspace } from '../lib/workspace'
import PageHeader from '../components/PageHeader'
import Loading from '../components/Loading'
import Modal from '../components/Modal'

type Member = {
  _id: Id<'organizationMembers'>
  userId: string
  role: string
  status: string
  createdAt?: number
  email: string | null
  name: string | null
  imageUrl: string | null
}

type Invite = {
  _id: Id<'invitations'>
  email: string
  role: string
  createdAt: number
  expiresAt: number
}

const ROLE_STYLE: Record<string, string> = {
  owner: 'bg-violet-50 text-violet-700',
  admin: 'bg-blue-50 text-blue-700',
  member: 'bg-neutral-100 text-neutral-600',
  viewer: 'bg-neutral-100 text-neutral-500',
}

export default function People() {
  const { organization, isAdmin, membership } = useWorkspace()
  const orgId = organization?._id
  const members = useQuery(
    api.memberships.listWithUsers,
    orgId ? { organizationId: orgId } : 'skip',
  ) as Member[] | undefined
  const invites = useQuery(
    api.memberships.listPendingInvitations,
    orgId ? { organizationId: orgId } : 'skip',
  ) as Invite[] | undefined

  const invite = useMutation(api.memberships.invite)
  const updateRole = useMutation(api.memberships.updateRole)
  const remove = useMutation(api.memberships.remove)
  const revokeInvite = useMutation(api.memberships.revokeInvitation)

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!orgId || members === undefined || invites === undefined) {
    return <Loading message="Loading people…" />
  }

  const send = async () => {
    const email = inviteEmail.trim().toLowerCase()
    if (!email) return
    setBusy('invite')
    setError(null)
    try {
      const res = (await invite({ organizationId: orgId, email, role: inviteRole })) as {
        token: string
      }
      setInviteLink(`${window.location.origin}/invite/${res.token}`)
      setInviteEmail('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invite failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        subtitle={`${members.length} member${members.length === 1 ? '' : 's'} in ${organization?.name ?? 'this workspace'}`}
        actions={
          isAdmin ? (
            <button onClick={() => setShowInvite(true)} className="btn-primary">
              <UserPlus className="w-4 h-4" /> Invite member
            </button>
          ) : undefined
        }
      />

      <section className="app-panel overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h2 className="font-medium text-sm">Members</h2>
        </div>
        <div className="divide-y divide-neutral-100">
          {members.map((m) => (
            <div key={m._id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-600 shrink-0 overflow-hidden">
                {m.imageUrl ? (
                  <img src={m.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (m.name ?? m.email ?? '?').slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {m.name ?? m.email ?? m.userId}
                  {membership?.userId === m.userId && (
                    <span className="text-neutral-400 font-normal"> (you)</span>
                  )}
                </p>
                {m.email && m.name && (
                  <p className="text-xs text-neutral-500 truncate">{m.email}</p>
                )}
              </div>
              <span className={`badge capitalize ${ROLE_STYLE[m.role] ?? ''}`}>{m.role}</span>
              {isAdmin && m.role !== 'owner' && membership?.userId !== m.userId && (
                <div className="flex items-center gap-1 shrink-0">
                  <select
                    value={m.role}
                    onChange={async (e) => {
                      setBusy(m.userId)
                      try {
                        await updateRole({
                          organizationId: orgId,
                          userId: m.userId,
                          role: e.target.value,
                        })
                      } finally {
                        setBusy(null)
                      }
                    }}
                    disabled={busy !== null}
                    className="input-field text-xs w-auto py-1"
                  >
                    <option value="admin">admin</option>
                    <option value="member">member</option>
                    <option value="viewer">viewer</option>
                  </select>
                  <button
                    onClick={async () => {
                      if (!confirm(`Remove ${m.email ?? m.userId} from the workspace?`)) return
                      setBusy(m.userId)
                      try {
                        await remove({ organizationId: orgId, userId: m.userId })
                      } finally {
                        setBusy(null)
                      }
                    }}
                    disabled={busy !== null}
                    className="btn-ghost text-xs text-rose-600"
                    title="Remove member"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {m.role === 'owner' && (
                <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </section>

      {invites.length > 0 && (
        <section className="app-panel overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100">
            <h2 className="font-medium text-sm">Pending invitations</h2>
          </div>
          <div className="divide-y divide-neutral-100">
            {invites.map((i) => (
              <div key={i._id} className="px-4 py-3 flex items-center gap-3">
                <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-neutral-800 truncate">{i.email}</p>
                  <p className="text-[11px] text-neutral-400">
                    invited {new Date(i.createdAt).toLocaleDateString()} · expires{' '}
                    {new Date(i.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`badge capitalize ${ROLE_STYLE[i.role] ?? ''}`}>{i.role}</span>
                {isAdmin && (
                  <button
                    onClick={async () => {
                      setBusy(i._id)
                      try {
                        await revokeInvite({ organizationId: orgId, invitationId: i._id })
                      } finally {
                        setBusy(null)
                      }
                    }}
                    disabled={busy !== null}
                    className="btn-ghost text-xs text-neutral-400"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <Modal
        open={showInvite}
        onClose={() => {
          setShowInvite(false)
          setInviteLink(null)
          setError(null)
        }}
        title="Invite member"
      >
        {inviteLink ? (
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">
              Invitation created. Share this link — it expires in 7 days.
            </p>
            <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-xs font-mono break-all select-all">
              {inviteLink}
            </div>
            <button onClick={() => setInviteLink(null)} className="btn-secondary w-full">
              Invite another
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-neutral-500">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="input-field mt-1"
                placeholder="teammate@company.com"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="input-field mt-1"
              >
                <option value="member">member — review discoveries, manage cases</option>
                <option value="admin">admin — members, settings, provider actions</option>
                <option value="viewer">viewer — read-only</option>
              </select>
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button
              onClick={send}
              disabled={!inviteEmail.trim() || busy !== null}
              className="btn-primary w-full"
            >
              {busy === 'invite' ? 'Creating…' : 'Create invitation'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
