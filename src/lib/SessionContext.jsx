import { createContext, useContext, useEffect, useState } from 'react'
import { getSession, onAuthStateChange } from './auth.js'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    getSession().then(setSession)
    return onAuthStateChange(setSession)
  }, [])

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}

export function useIsOwner(ownerEmail) {
  const session = useSession()
  if (!session) return false
  return session.user?.email === ownerEmail
}
