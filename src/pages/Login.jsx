import { useState } from 'react'
import BrandMark from '../components/Brand.jsx'
import { sendMagicLink } from '../lib/auth.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    setErrorMessage('')
    try {
      const redirectTo = `${window.location.origin}/auth/callback`
      await sendMagicLink(email.trim(), redirectTo)
      setStatus('sent')
    } catch (err) {
      console.error(err)
      setErrorMessage('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <BrandMark />
        <h1 className="mt-8 text-2xl font-medium">Check your email</h1>
        <p className="mt-3 max-w-md text-neutral-400">
          We sent a sign-in link to <span className="text-white">{email}</span>. Click the link in
          that email to continue — it expires in 1 hour.
        </p>
        <button onClick={() => setStatus('idle')}
          className="mt-6 text-sm text-neutral-500 underline underline-offset-2">
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <BrandMark />
      <div className="mt-10 w-full max-w-sm">
        <h1 className="text-2xl font-medium">Sign in</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Enter your email and we&apos;ll send you a sign-in link — no password needed.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-neutral-300">Email address</label>
            <input id="email" type="email" required autoFocus value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none" />
          </div>
          {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
          <button type="submit" disabled={status === 'sending'}
            className="w-full rounded-md bg-gold-gradient px-5 py-2 text-sm font-medium text-neutral-900 disabled:opacity-60">
            {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
          </button>
        </form>
      </div>
    </div>
  )
}
