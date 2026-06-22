import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandMark from '../components/Brand.jsx'
import { supabase } from '../lib/supabase.js'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        const hash = window.location.hash
        const params = new URLSearchParams(hash.replace('#', ''))
        const errDesc = params.get('error_description')
        setError(errDesc || 'The sign-in link was invalid or has expired. Please request a new one.')
        return
      }
      navigate('/dashboard', { replace: true })
    })
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <BrandMark />
        <h1 className="mt-8 text-2xl font-medium">Link expired</h1>
        <p className="mt-3 max-w-md text-neutral-400">{error}</p>
        <a href="/login" className="mt-6 rounded-md bg-gold-gradient px-5 py-2 text-sm font-medium text-neutral-900">Request a new sign-in link</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <BrandMark />
      <p className="mt-8 text-neutral-400 text-sm">Signing you in…</p>
    </div>
  )
}
