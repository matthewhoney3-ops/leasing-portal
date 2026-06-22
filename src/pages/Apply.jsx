import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import BrandMark from '../components/Brand.jsx'
import DatePicker from '../components/DatePicker.jsx'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { SCREENING_LINKS } from '../lib/screeningLinks.js'

const initialForm = {
  applicant_name: '',
  applicant_email: '',
  applicant_phone: '',
  date_of_birth: '',
  num_occupants: '',
  employment_status: '',
  employer_name: '',
  monthly_income: '',
  current_address: '',
  current_landlord_name: '',
  current_landlord_phone: '',
  reason_for_moving: '',
  prior_eviction: '',
  desired_move_in: '',
  notes: '',
}

const EMPLOYMENT_OPTIONS = [
  { value: 'employed', label: 'Employed full-time' },
  { value: 'part_time', label: 'Employed part-time' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'student', label: 'Student' },
  { value: 'retired', label: 'Retired' },
  { value: 'other', label: 'Other' },
]

function SectionHeading({ number, title }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-6 rounded-full bg-gold-gradient flex items-center justify-center text-neutral-900 text-xs font-bold flex-shrink-0">
        {number}
      </div>
      <h2 className="text-sm font-medium text-neutral-200 uppercase tracking-wide">{title}</h2>
    </div>
  )
}

export default function Apply() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const propertyId = searchParams.get('property') || 'unspecified'
  const propertyLabel = searchParams.get('label') || 'Golden Hive Capital rental'
  const screeningLink = SCREENING_LINKS[propertyId]

  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true })
    })
  }, [navigate])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.applicant_name.trim() || !form.applicant_email.trim()) {
      setErrorMessage('Name and email are required.')
      return
    }
    if (!form.monthly_income || !form.employment_status) {
      setErrorMessage('Employment status and monthly income are required.')
      return
    }
    setStatus('submitting')
    setErrorMessage('')

    try {
      const { data: existing } = await supabase
        .from('applications')
        .select('id, status')
        .eq('applicant_email', form.applicant_email.trim())
        .eq('property_id', propertyId)
        .not('status', 'in', '("denied","withdrawn")')
        .limit(1)

      if (existing && existing.length > 0) {
        await supabase.auth.signInWithOtp({
          email: form.applicant_email.trim(),
          options: { emailRedirectTo: `${window.location.origin}/auth/callback`, shouldCreateUser: false },
        })
        setStatus('existing')
        return
      }

      const { error: authError } = await supabase.auth.signInWithOtp({
        email: form.applicant_email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { full_name: form.applicant_name.trim() },
          shouldCreateUser: true,
        },
      })
      if (authError) { console.error('Auth error:', authError); throw authError }

      const { error: insertError } = await supabase.from('applications').insert({
        property_id: propertyId,
        property_label: propertyLabel,
        applicant_name: form.applicant_name.trim(),
        applicant_email: form.applicant_email.trim(),
        applicant_phone: form.applicant_phone.trim() || null,
        date_of_birth: form.date_of_birth || null,
        num_occupants: form.num_occupants ? Number(form.num_occupants) : null,
        employment_status: form.employment_status || null,
        employer_name: form.employer_name.trim() || null,
        monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
        current_address: form.current_address.trim() || null,
        current_landlord_name: form.current_landlord_name.trim() || null,
        current_landlord_phone: form.current_landlord_phone.trim() || null,
        reason_for_moving: form.reason_for_moving.trim() || null,
        prior_eviction: form.prior_eviction === 'yes',
        desired_move_in: form.desired_move_in || null,
        notes: form.notes.trim() || null,
        status: screeningLink ? 'screening_sent' : 'submitted',
        screening_link: screeningLink || null,
      })
      if (insertError) { console.error('Insert error:', insertError); throw insertError }

      setStatus('success')
    } catch (err) {
      console.error('Submit error:', err)
      setErrorMessage('Something went wrong submitting your application. Please try again.')
      setStatus('error')
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <BrandMark />
        <h1 className="mt-8 text-2xl font-medium">Applications aren&apos;t available right now</h1>
        <p className="mt-3 max-w-md text-neutral-400">Something&apos;s misconfigured on our end. Please check back shortly.</p>
      </div>
    )
  }

  if (status === 'existing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <BrandMark />
        <h1 className="mt-8 text-2xl font-medium">You&apos;ve already applied</h1>
        <p className="mt-3 max-w-md text-neutral-400">
          We already have an active application on file for {form.applicant_email} at {propertyLabel}.
          We&apos;ve sent you a sign-in link to check your application status.
        </p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <BrandMark />
        <h1 className="mt-8 text-2xl font-medium">Application received</h1>
        <p className="mt-3 max-w-md text-neutral-400">
          Thanks, {form.applicant_name.split(' ')[0]} — we&apos;ve received your application for{' '}
          {propertyLabel}. Check your email for a sign-in link to track your application status.
        </p>
        {screeningLink && (
          <>
            <p className="mt-4 max-w-md text-neutral-400 text-sm">
              Last step: complete the credit and background check through RentSpree. The $30&ndash;35 fee goes directly to them, not to us.
            </p>
            <a href={screeningLink} target="_blank" rel="noreferrer"
              className="mt-6 rounded-md bg-gold-gradient px-5 py-2 text-sm font-medium text-neutral-900">
              Continue to screening &amp; background check
            </a>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <BrandMark />
      <div className="mt-10 w-full max-w-lg">
        <h1 className="text-2xl font-medium">Apply for {propertyLabel}</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Complete the form below. Fields marked <span className="text-red-400">*</span> are required.
          A credit and background check through RentSpree follows submission — their fee is paid directly to them.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <div className="bg-neutral-900 border border-white/5 rounded-lg p-5">
            <SectionHeading number="1" title="About you" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="applicant_name" className="block text-sm text-neutral-300">Full legal name<span className="text-red-400 ml-0.5">*</span></label>
                <input id="applicant_name" type="text" required value={form.applicant_name}
                  onChange={(e) => updateField('applicant_name', e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="applicant_email" className="block text-sm text-neutral-300">Email address<span className="text-red-400 ml-0.5">*</span></label>
                <input id="applicant_email" type="email" required value={form.applicant_email}
                  onChange={(e) => updateField('applicant_email', e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none" />
              </div>
              <div>
                <label htmlFor="applicant_phone" className="block text-sm text-neutral-300">Phone number<span className="text-neutral-600 ml-1 text-xs">(optional)</span></label>
                <input id="applicant_phone" type="tel" value={form.applicant_phone}
                  onChange={(e) => updateField('applicant_phone', e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none" />
              </div>
              <div>
                <label htmlFor="date_of_birth" className="block text-sm text-neutral-300">Date of birth<span className="text-red-400 ml-0.5">*</span></label>
                <div className="mt-1">
                  <DatePicker id="date_of_birth" value={form.date_of_birth}
                    onChange={(v) => updateField('date_of_birth', v)} placeholder="Select date of birth" />
                </div>
              </div>
              <div>
                <label htmlFor="num_occupants" className="block text-sm text-neutral-300">Total occupants moving in<span className="text-red-400 ml-0.5">*</span></label>
                <select id="num_occupants" required value={form.num_occupants}
                  onChange={(e) => updateField('num_occupants', e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none">
                  <option value="">Select</option>
                  {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-white/5 rounded-lg p-5">
            <SectionHeading number="2" title="Employment & income" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm text-neutral-300">Employment status<span className="text-red-400 ml-0.5">*</span></label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {EMPLOYMENT_OPTIONS.map(opt => (
                    <label key={opt.value}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm transition-colors
                        ${form.employment_status === opt.value ? 'border-gold-mid text-gold-mid bg-gold-mid/5' : 'border-neutral-700 text-neutral-300 hover:border-neutral-500'}`}>
                      <input type="radio" name="employment_status" value={opt.value}
                        checked={form.employment_status === opt.value}
                        onChange={(e) => updateField('employment_status', e.target.value)}
                        className="sr-only" />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="employer_name" className="block text-sm text-neutral-300">Employer / company name<span className="text-neutral-600 ml-1 text-xs">(optional)</span></label>
                <input id="employer_name" type="text" value={form.employer_name}
                  onChange={(e) => updateField('employer_name', e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="monthly_income" className="block text-sm text-neutral-300">Gross monthly income<span className="text-red-400 ml-0.5">*</span></label>
                <div className="mt-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
                  <input id="monthly_income" type="number" required min="0" value={form.monthly_income}
                    onChange={(e) => updateField('monthly_income', e.target.value)}
                    placeholder="e.g. 7000"
                    className="w-full rounded-md border border-neutral-700 bg-neutral-900 pl-7 pr-3 py-2 text-sm focus:border-gold-mid focus:outline-none" />
                </div>
                <p className="mt-1 text-xs text-neutral-500">Minimum required: $6,600/mo (3× rent) — negotiable depending on overall application</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-white/5 rounded-lg p-5">
            <SectionHeading number="3" title="Rental history" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="current_address" className="block text-sm text-neutral-300">Current address<span className="text-neutral-600 ml-1 text-xs">(optional)</span></label>
                <input id="current_address" type="text" value={form.current_address}
                  onChange={(e) => updateField('current_address', e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none" />
              </div>
              <div>
                <label htmlFor="current_landlord_name" className="block text-sm text-neutral-300">Current landlord name<span className="text-neutral-600 ml-1 text-xs">(optional)</span></label>
                <input id="current_landlord_name" type="text" value={form.current_landlord_name}
                  onChange={(e) => updateField('current_landlord_name', e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none" />
              </div>
              <div>
                <label htmlFor="current_landlord_phone" className="block text-sm text-neutral-300">Current landlord phone<span className="text-neutral-600 ml-1 text-xs">(optional)</span></label>
                <input id="current_landlord_phone" type="tel" value={form.current_landlord_phone}
                  onChange={(e) => updateField('current_landlord_phone', e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="reason_for_moving" className="block text-sm text-neutral-300">Reason for moving<span className="text-neutral-600 ml-1 text-xs">(optional)</span></label>
                <input id="reason_for_moving" type="text" value={form.reason_for_moving}
                  placeholder="e.g. lease ending, relocating for work"
                  onChange={(e) => updateField('reason_for_moving', e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-neutral-300">Have you ever been evicted?<span className="text-red-400 ml-0.5">*</span></label>
                <div className="mt-2 flex gap-3">
                  {['no','yes'].map(v => (
                    <label key={v}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer text-sm transition-colors
                        ${form.prior_eviction === v
                          ? v === 'yes' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-gold-mid text-gold-mid bg-gold-mid/5'
                          : 'border-neutral-700 text-neutral-300 hover:border-neutral-500'}`}>
                      <input type="radio" name="prior_eviction" value={v}
                        checked={form.prior_eviction === v}
                        onChange={(e) => updateField('prior_eviction', e.target.value)}
                        className="sr-only" />
                      {v === 'yes' ? 'Yes' : 'No'}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 border border-white/5 rounded-lg p-5">
            <SectionHeading number="4" title="Move-in & notes" />
            <div className="space-y-4">
              <div>
                <label htmlFor="desired_move_in" className="block text-sm text-neutral-300">Desired move-in date<span className="text-neutral-600 ml-1 text-xs">(optional)</span></label>
                <div className="mt-1">
                  <DatePicker id="desired_move_in" value={form.desired_move_in}
                    onChange={(v) => updateField('desired_move_in', v)} placeholder="Select desired move-in date" />
                </div>
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm text-neutral-300">
                  Anything else we should know?<span className="text-neutral-600 ml-1 text-xs">(optional)</span>
                </label>
                <textarea id="notes" rows={3} value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none" />
              </div>
            </div>
          </div>

          {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

          <button type="submit" disabled={status === 'submitting'}
            className="w-full rounded-md bg-gold-gradient px-5 py-3 text-sm font-medium text-neutral-900 disabled:opacity-60">
            {status === 'submitting' ? 'Submitting…' : 'Submit application'}
          </button>
        </form>
      </div>
    </div>
  )
}
