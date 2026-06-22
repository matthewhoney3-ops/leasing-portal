import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import BrandMark from '../components/Brand.jsx'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { SCREENING_LINKS } from '../lib/screeningLinks.js'

const initialForm = {
  applicant_name: '',
  applicant_email: '',
  applicant_phone: '',
  desired_move_in: '',
  notes: '',
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
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            shouldCreateUser: false,
          },
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
        <p className="mt-3 max-w-md text-neutral-400">Something&apos;s misconfigured on our end. Please check back shortly, or reach out to us directly.</p>
      </div>
    )
  }

  if (status === 'existing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <BrandMark />
        <h1 className="mt-8 text-2xl font-medium">You&apos;ve already applied</h1>
        <p className="mt-3 max-w-md text-neutral-400">
          We already have an active application on file for {form.applicant_email} at{' '}
          {propertyLabel}. We&apos;ve sent you a sign-in link so you can check your application status.
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
              You can also start the credit and background check now — the $30&ndash;35 screening fee goes directly to RentSpree, not to us.
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
      <div className="mt-10 w-full max-w-md">
        <h1 className="text-2xl font-medium">Apply for {propertyLabel}</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Fill out the form below to start your application. There&apos;s no fee to apply — right after you submit, you&apos;ll continue to a credit and background check through our screening partner, RentSpree, where their fee is paid directly to them.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="applicant_name" className="block text-sm text-neutral-300">Full name</label>
            <input id="applicant_name" type="text" required value={form.applicant_name}
              onChange={(e) => updateField('applicant_name', e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none" />
          </div>
          <div>
            <label htmlFor="applicant_email" className="block text-sm text-neutral-300">Email</label>
            <input id="applicant_email" type="email" required value={form.applicant_email}
              onChange={(e) => updateField('applicant_email', e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none" />
          </div>
          <div>
            <label htmlFor="applicant_phone" className="block text-sm text-neutral-300">Phone (optional)</label>
            <input id="applicant_phone" type="tel" value={form.applicant_phone}
              onChange={(e) => updateField('applicant_phone', e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none" />
          </div>
          <div>
            <label htmlFor="desired_move_in" className="block text-sm text-neutral-300">Desired move-in date (optional)</label>
            <input id="desired_move_in" type="date" value={form.desired_move_in}
              onChange={(e) => updateField('desired_move_in', e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none" />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm text-neutral-300">Anything else we should know? (optional)</label>
            <textarea id="notes" rows={3} value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none" />
          </div>
          {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
          <button type="submit" disabled={status === 'submitting'}
            className="w-full rounded-md bg-gold-gradient px-5 py-2 text-sm font-medium text-neutral-900 disabled:opacity-60">
            {status === 'submitting' ? 'Submitting…' : 'Submit application'}
          </button>
        </form>
      </div>
    </div>
  )
}
