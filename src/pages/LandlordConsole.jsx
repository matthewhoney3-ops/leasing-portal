import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BrandMark from '../components/Brand.jsx'
import DatePicker from '../components/DatePicker.jsx'
import { useSession, useIsOwner } from '../lib/SessionContext.jsx'
import { signOut } from '../lib/auth.js'
import { LEASE_PROPERTIES } from '../lib/leaseProperties.js'
import { supabase } from '../lib/supabase.js'
import { Packer } from 'docx'
import { buildLeaseDocument } from '../lib/leaseTemplate.js'

const OWNER_EMAIL = 'goldenhivecapital@gmail.com'

const STATUS_OPTIONS = ['submitted','screening_sent','screening_complete','approved','denied','withdrawn']

const STATUS_COLORS = {
  submitted: 'text-blue-400',
  screening_sent: 'text-amber-400',
  screening_complete: 'text-amber-300',
  approved: 'text-green-400',
  denied: 'text-neutral-500',
  withdrawn: 'text-neutral-500',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function LandlordConsole() {
  const session = useSession()
  const isOwner = useIsOwner(OWNER_EMAIL)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [applications, setApplications] = useState([])
  const [leases, setLeases] = useState({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [leaseForm, setLeaseForm] = useState(null)
  const [generatingLease, setGeneratingLease] = useState(false)
  const selectedId = searchParams.get('app')

  useEffect(() => {
    if (session === undefined) return
    if (session === null) { navigate('/login'); return }
    if (!isOwner) { navigate('/dashboard'); return }
    loadAll()
  }, [session, isOwner])

  useEffect(() => {
    if (selectedId && applications.length) {
      const app = applications.find(a => a.id === selectedId) ?? null
      setSelected(app)
      if (app) initLeaseForm(app)
    } else {
      setSelected(null)
      setLeaseForm(null)
    }
  }, [selectedId, applications])

  async function loadAll() {
    const { data: apps } = await supabase.from('applications').select('*').order('created_at', { ascending: false })
    setApplications(apps ?? [])
    if (apps?.length) {
      const { data: ls } = await supabase.from('leases').select('*').in('application_id', apps.map(a => a.id))
      const byApp = {}
      for (const l of ls ?? []) byApp[l.application_id] = l
      setLeases(byApp)
    }
    setLoading(false)
  }

  function initLeaseForm(app) {
    const knownProperty = LEASE_PROPERTIES.find(p => p.id === app.property_id)
    setLeaseForm({
      tenantNames: app.applicant_name,
      propertyAddress: knownProperty?.address ?? '',
      leaseStartDate: app.desired_move_in ?? '',
      leaseEndDate: '',
      monthlyRent: knownProperty?.monthlyRent ?? '',
      rentDueDay: '1',
      lateFeeAmount: '75',
      gracePeriodDays: '5',
      securityDeposit: knownProperty?.securityDeposit ?? '',
      petDeposit: knownProperty?.petDeposit ?? '',
      petPolicy: knownProperty?.petPolicy ?? '',
      utilitiesTenantPays: knownProperty?.utilitiesTenantPays ?? '',
      utilitiesLandlordPays: knownProperty?.utilitiesLandlordPays ?? '',
    })
  }

  async function updateStatus(app, newStatus) {
    setSaving(true)
    const { data, error } = await supabase.from('applications').update({ status: newStatus }).eq('id', app.id).select().single()
    if (!error && data) {
      setApplications(prev => prev.map(a => a.id === app.id ? data : a))
      if (selected?.id === app.id) setSelected(data)
      if (["approved", "denied"].includes(newStatus)) {
        fetch("/.netlify/functions/notify-status-change", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicant_name: app.applicant_name, applicant_email: app.applicant_email, property_label: app.property_label, new_status: newStatus }),
        }).catch(err => console.error("Notification error:", err))
      }
    }
    setSaving(false)
  }

  async function updateLeaseStatus(leaseId, newStatus, signwellLink) {
    setSaving(true)
    const updates = { status: newStatus }
    if (signwellLink !== undefined) updates.signwell_link = signwellLink
    const { data, error } = await supabase.from('leases').update(updates).eq('id', leaseId).select().single()
    if (!error && data) setLeases(prev => ({ ...prev, [data.application_id]: data }))
    setSaving(false)
  }

  async function generateLease() {
    if (!selected || !leaseForm) return
    if (!leaseForm.tenantNames?.trim() || !leaseForm.leaseStartDate || !leaseForm.leaseEndDate || !leaseForm.monthlyRent) {
      alert('Please fill in tenant name, start date, end date, and monthly rent before generating.')
      return
    }
    setGeneratingLease(true)
    try {
      const fmt = iso => iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
      const doc = buildLeaseDocument({
        landlordName: 'Golden Hive Capital',
        propertyLabel: selected.property_label,
        propertyAddress: leaseForm.propertyAddress ?? selected.property_label,
        tenantNames: leaseForm.tenantNames,
        additionalOccupants: '',
        leaseStartDate: fmt(leaseForm.leaseStartDate),
        leaseEndDate: fmt(leaseForm.leaseEndDate),
        monthlyRent: leaseForm.monthlyRent,
        rentDueDay: leaseForm.rentDueDay,
        lateFeeAmount: leaseForm.lateFeeAmount,
        gracePeriodDays: leaseForm.gracePeriodDays,
        securityDeposit: leaseForm.securityDeposit,
        petDeposit: leaseForm.petDeposit,
        petPolicy: leaseForm.petPolicy,
        utilitiesTenantPays: leaseForm.utilitiesTenantPays,
        utilitiesLandlordPays: leaseForm.utilitiesLandlordPays,
        agreementDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      })
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Lease - ${leaseForm.tenantNames} - ${selected.property_label}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      const existingLease = leases[selected.id]
      if (!existingLease) {
        const { data } = await supabase.from('leases').insert({
          application_id: selected.id,
          property_id: selected.property_id,
          property_label: selected.property_label,
          tenant_name: leaseForm.tenantNames,
          tenant_email: selected.applicant_email,
          lease_start: leaseForm.leaseStartDate,
          lease_end: leaseForm.leaseEndDate,
          monthly_rent: Number(leaseForm.monthlyRent),
          status: 'pending',
        }).select().single()
        if (data) setLeases(prev => ({ ...prev, [selected.id]: data }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingLease(false)
    }
  }

  function handleSignOut() {
    signOut().then(() => navigate('/login'))
  }

  if (session === undefined || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500 text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <BrandMark />
        <button onClick={handleSignOut} className="text-sm text-neutral-500 hover:text-neutral-300">Sign out</button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-white/5 overflow-y-auto flex-shrink-0">
          <div className="px-4 py-3 border-b border-white/5">
            <h2 className="text-sm font-medium text-neutral-300">Applications</h2>
            <p className="text-xs text-neutral-500">{applications.length} total</p>
          </div>
          {applications.length === 0 && (
            <p className="text-sm text-neutral-500 px-4 py-6">No applications yet.</p>
          )}
          {applications.map(app => (
            <button key={app.id} onClick={() => setSearchParams({ app: app.id })}
              className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${selected?.id === app.id ? 'bg-white/5' : ''}`}>
              <div className="text-sm font-medium truncate">{app.applicant_name}</div>
              <div className="text-xs text-neutral-400 truncate">{app.property_label}</div>
              <div className={`text-xs mt-0.5 ${STATUS_COLORS[app.status] ?? 'text-neutral-400'}`}>{app.status.replace(/_/g, ' ')}</div>
              <div className="text-xs text-neutral-600">{formatDate(app.created_at)}</div>
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!selected ? (
            <p className="text-neutral-500 text-sm">Select an application to view details.</p>
          ) : (
            <div className="max-w-2xl space-y-8">
              <div>
                <h1 className="text-xl font-medium">{selected.applicant_name}</h1>
                <p className="text-neutral-400 text-sm">{selected.property_label} · Applied {formatDate(selected.created_at)}</p>
              </div>
              <div className="bg-neutral-900 border border-white/5 rounded-lg p-5">
                <div className="text-xs uppercase tracking-wide text-neutral-500 mb-3">Status</div>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} disabled={saving || selected.status === s} onClick={() => updateStatus(selected, s)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${selected.status === s ? 'border-gold-mid text-gold-mid' : 'border-white/10 text-neutral-400 hover:border-white/30'}`}>
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-neutral-900 border border-white/5 rounded-lg p-5 text-sm space-y-2">
                <div className="text-xs uppercase tracking-wide text-neutral-500 mb-3">Applicant details</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-neutral-500">Email</span><span className="text-neutral-300">{selected.applicant_email}</span>
                  <span className="text-neutral-500">Phone</span><span className="text-neutral-300">{selected.applicant_phone || '—'}</span>
                  <span className="text-neutral-500">DOB</span><span className="text-neutral-300">{selected.date_of_birth ? formatDate(`${selected.date_of_birth}T00:00:00`) : '—'}</span>
                  <span className="text-neutral-500">Occupants</span><span className="text-neutral-300">{selected.num_occupants ?? '—'}</span>
                  <span className="text-neutral-500">Employment</span><span className="text-neutral-300">{selected.employment_status?.replace(/_/g, ' ') || '—'}</span>
                  <span className="text-neutral-500">Income</span><span className={selected.monthly_income && Number(selected.monthly_income) > 0 ? 'text-neutral-300' : 'text-neutral-500'}>{selected.monthly_income ? `$${Number(selected.monthly_income).toLocaleString()}/mo` : '—'}</span>
                  <span className="text-neutral-500">Prior eviction</span><span className={selected.prior_eviction ? 'text-red-400 font-medium' : 'text-neutral-300'}>{selected.prior_eviction === null || selected.prior_eviction === undefined ? '—' : selected.prior_eviction ? 'Yes' : 'No'}</span>
                  <span className="text-neutral-500">Move-in</span><span className="text-neutral-300">{selected.desired_move_in ? formatDate(`${selected.desired_move_in}T00:00:00`) : '—'}</span>
                  {selected.screening_link && <>
                    <span className="text-neutral-500">Screening</span>
                    <a href={selected.screening_link} target="_blank" rel="noreferrer" className="text-gold-mid underline underline-offset-2 text-xs truncate">View report</a>
                  </>}
                </div>
                {selected.notes && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="text-xs text-neutral-500 mb-1">Notes from applicant</div>
                    <p className="text-neutral-300">{selected.notes}</p>
                  </div>
                )}
              </div>
              <div className="bg-neutral-900 border border-white/5 rounded-lg p-5">
                <div className="text-xs uppercase tracking-wide text-neutral-500 mb-3">Lease</div>
                {leases[selected.id] ? (
                  <div className="space-y-3">
                    <div className="text-sm text-neutral-300">
                      {formatDate(`${leases[selected.id].lease_start}T00:00:00`)} — {formatDate(`${leases[selected.id].lease_end}T00:00:00`)}
                      <span className="text-neutral-500 ml-2">${Number(leases[selected.id].monthly_rent).toLocaleString()}/mo</span>
                    </div>
                    <div className={`text-xs ${STATUS_COLORS[leases[selected.id].status] ?? 'text-neutral-400'}`}>{leases[selected.id].status}</div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">SignWell signing link (paste after uploading)</label>
                      <div className="flex gap-2">
                        <input type="url" defaultValue={leases[selected.id].signwell_link ?? ''} placeholder="https://signwell.com/..."
                          onBlur={e => updateLeaseStatus(leases[selected.id].id, leases[selected.id].status, e.target.value)}
                          className="flex-1 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs focus:border-gold-mid focus:outline-none" />
                        {leases[selected.id].status !== 'signed' && (
                          <button onClick={() => updateLeaseStatus(leases[selected.id].id, 'signed', undefined)}
                            className="px-3 py-1 rounded border border-green-700 text-green-400 text-xs hover:bg-green-900/20">
                            Mark signed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-neutral-500">No lease generated yet.</p>
                    {leaseForm && (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          ['tenantNames','Tenant name(s)','text'],
                          ['leaseStartDate','Start date','date'],
                          ['leaseEndDate','End date','date'],
                          ['monthlyRent','Monthly rent ($)','number'],
                          ['securityDeposit','Security deposit ($)','number'],
                          ['utilitiesTenantPays','Tenant pays','text'],
                          ['utilitiesLandlordPays','Landlord pays','text'],
                          ['petPolicy','Pet policy','text'],
                          ['lateFeeAmount','Late fee ($)','number'],
                          ['gracePeriodDays','Grace period (days)','number'],
                        ].map(([field, label, type]) => (
                          <div key={field}>
                            <label className="block text-xs text-neutral-500 mb-1">{label}</label>
                            <input type={type} value={leaseForm[field] ?? ''}
                              onChange={e => setLeaseForm(prev => ({ ...prev, [field]: e.target.value }))}
                              className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs focus:border-gold-mid focus:outline-none" />
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={generateLease} disabled={generatingLease}
                      className="rounded bg-gold-gradient px-4 py-2 text-xs font-medium text-neutral-900 disabled:opacity-60">
                      {generatingLease ? 'Generating…' : 'Generate lease (.docx)'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
