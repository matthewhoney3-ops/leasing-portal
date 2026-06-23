curl -o src/pages/TenantDashboard.jsx https://raw.githubusercontent.com/matthewhoney3-ops/leasing-portal/main/src/pages/TenantDashboard.jsx
sed -i '' '/Continue to screening/{
n
n
n
n
a\
\
            \{!\['"'"'denied'"'"','"'"'withdrawn'"'"','"'"'approved'"'"'\].includes(application.status) \&\& (\
              <div className="mt-4 pt-4 border-t border-white\/5">\
                \{withdrawConfirm ? (\
                  <div>\
                    <p className="text-sm text-neutral-400 mb-3">Are you sure you want to withdraw? This cannot be undone.<\/p>\
                    <div className="flex gap-3">\
                      <button onClick=\{handleWithdraw\} disabled=\{withdrawing\} className="px-4 py-1.5 rounded border border-red-700 text-red-400 text-xs hover:bg-red-900\/20 disabled:opacity-60">\{withdrawing ? '"'"'Withdrawing…'"'"' : '"'"'Yes, withdraw'"'"'\}<\/button>\
                      <button onClick=\{() => setWithdrawConfirm(false)\} className="px-4 py-1.5 rounded border border-neutral-700 text-neutral-400 text-xs">Cancel<\/button>\
                    <\/div>\
                  <\/div>\
                ) : (\
                  <button onClick=\{handleWithdraw\} className="text-xs text-neutral-500 hover:text-neutral-300 underline underline-offset-2">Withdraw application<\/button>\
                )\}\
              <\/div>\
            )\}
}' src/pages/TenantDashboard.jsx
cat > src/pages/TenantDashboard.jsx << 'ENDOFFILE'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandMark from '../components/Brand.jsx'
import { useSession } from '../lib/SessionContext.jsx'
import { signOut } from '../lib/auth.js'
import { supabase } from '../lib/supabase.js'

const STATUS_LABELS = {
  submitted: { label: 'Application received', color: 'text-blue-400', next: 'We\'ll send you a screening link shortly.' },
  screening_sent: { label: 'Screening in progress', color: 'text-amber-400', next: 'Complete the credit and background check via the link we sent.' },
  screening_complete: { label: 'Screening complete', color: 'text-amber-400', next: 'We\'re reviewing your application — we\'ll be in touch soon.' },
  approved: { label: 'Approved!', color: 'text-green-400', next: 'Great news — we\'ve approved your application. Your lease will be sent shortly.' },
  denied: { label: 'Application closed', color: 'text-neutral-400', next: 'Thank you for your interest. We\'ve decided not to move forward at this time.' },
  withdrawn: { label: 'Withdrawn', color: 'text-neutral-400', next: '' },
}

export default function TenantDashboard() {
  const session = useSession()
  const navigate = useNavigate()
  const [application, setApplication] = useState(null)
  const [lease, setLease] = useState(null)
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawConfirm, setWithdrawConfirm] = useState(false)

  useEffect(() => {
    if (session === undefined) return
    if (session === null) { navigate('/login'); return }
    async function load() {
      const { data: apps } = await supabase.from('applications').select('*').order('created_at', { ascending: false }).limit(1)
      const app = apps?.[0] ?? null
      setApplication(app)
      if (app) {
        const { data: leases } = await supabase.from('leases').select('*').eq('application_id', app.id).limit(1)
        setLease(leases?.[0] ?? null)
      }
      setLoading(false)
    }
    load()
  }, [session, navigate])

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  async function handleWithdraw() {
    if (!withdrawConfirm) { setWithdrawConfirm(true); return }
    setWithdrawing(true)
    const { data, error } = await supabase.from('applications').update({ status: 'withdrawn' }).eq('id', application.id).select().single()
    if (!error && data) {
      setApplication(data)
      fetch('/.netlify/functions/notify-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicant_name: application.applicant_name, applicant_email: application.applicant_email, property_label: application.property_label }),
      }).catch(err => console.error('Notification error:', err))
    }
    setWithdrawing(false)
    setWithdrawConfirm(false)
  }

  if (session === undefined || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Loading…</p>
      </div>
    )
  }

  const statusMeta = application ? STATUS_LABELS[application.status] ?? STATUS_LABELS.submitted : null

  return (
    <div className="min-h-screen px-6 py-12 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <BrandMark />
        <button onClick={handleSignOut} className="text-sm text-neutral-500 hover:text-neutral-300">Sign out</button>
      </div>

      {!application ? (
        <div>
          <h1 className="text-2xl font-medium">No application yet</h1>
          <p className="mt-3 text-neutral-400 text-sm">You don&apos;t have an active application on file. If you applied recently, it may take a moment to appear.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-medium">{application.property_label}</h1>
            <p className="text-sm text-neutral-400 mt-1">Applied {new Date(application.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="bg-neutral-900 border border-white/5 rounded-lg p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Status</div>
            <div className={`text-lg font-medium ${statusMeta?.color}`}>{statusMeta?.label}</div>
            {statusMeta?.next && <p className="mt-2 text-sm text-neutral-400">{statusMeta.next}</p>}
            {application.status === 'screening_sent' && application.screening_link && (
              <a href={application.screening_link} target="_blank" rel="noreferrer"
                className="mt-4 inline-block rounded-md bg-gold-gradient px-4 py-2 text-sm font-medium text-neutral-900">
                Continue to screening
              </a>
            )}
            {!['denied','withdrawn','approved'].includes(application.status) && (
              <div className="mt-4 pt-4 border-t border-white/5">
                {withdrawConfirm ? (
                  <div>
                    <p className="text-sm text-neutral-400 mb-3">Are you sure you want to withdraw your application? This cannot be undone.</p>
                    <div className="flex gap-3">
                      <button onClick={handleWithdraw} disabled={withdrawing}
                        className="px-4 py-1.5 rounded border border-red-700 text-red-400 text-xs hover:bg-red-900/20 disabled:opacity-60">
                        {withdrawing ? 'Withdrawing…' : 'Yes, withdraw'}
                      </button>
                      <button onClick={() => setWithdrawConfirm(false)}
                        className="px-4 py-1.5 rounded border border-neutral-700 text-neutral-400 text-xs hover:border-neutral-500">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={handleWithdraw}
                    className="text-xs text-neutral-500 hover:text-neutral-300 underline underline-offset-2">
                    Withdraw application
                  </button>
                )}
              </div>
            )}
          </div>

          {lease && (
            <div className="bg-neutral-900 border border-white/5 rounded-lg p-5">
              <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Lease</div>
              <div className="text-sm text-neutral-300">
                {new Date(lease.lease_start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {' — '}
                {new Date(lease.lease_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="text-sm text-neutral-400 mt-1">${Number(lease.monthly_rent).toLocaleString()}/month</div>
              {lease.signwell_link && lease.status !== 'signed' && (
                <a href={lease.signwell_link} target="_blank" rel="noreferrer"
                  className="mt-4 inline-block rounded-md bg-gold-gradient px-4 py-2 text-sm font-medium text-neutral-900">
                  Review and sign lease
                </a>
              )}
              {lease.status === 'signed' && <p className="mt-3 text-sm text-green-400">Lease signed ✓</p>}
            </div>
          )}

          <div className="bg-neutral-900 border border-white/5 rounded-lg p-5 text-sm">
            <div className="text-xs uppercase tracking-wide text-neutral-500 mb-3">Your details</div>
            <div className="space-y-1 text-neutral-300">
              <div>{application.applicant_name}</div>
              <div className="text-neutral-400">{application.applicant_email}</div>
              {application.applicant_phone && <div className="text-neutral-400">{application.applicant_phone}</div>}
              {application.desired_move_in && (
                <div className="text-neutral-400">Desired move-in: {new Date(`${application.desired_move_in}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
