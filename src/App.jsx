import { Routes, Route, Navigate } from 'react-router-dom'
import { SessionProvider, useSession, useIsOwner } from './lib/SessionContext.jsx'
import Home from './pages/Home.jsx'
import Apply from './pages/Apply.jsx'
import Login from './pages/Login.jsx'
import AuthCallback from './pages/AuthCallback.jsx'
import TenantDashboard from './pages/TenantDashboard.jsx'
import LandlordConsole from './pages/LandlordConsole.jsx'
import Lease from './pages/Lease.jsx'

const OWNER_EMAIL = 'goldenhivecapital@gmail.com'

function Dashboard() {
  const session = useSession()
  const isOwner = useIsOwner(OWNER_EMAIL)
  if (session === undefined) return null
  if (session === null) return <Navigate to="/login" replace />
  return isOwner ? <LandlordConsole /> : <TenantDashboard />
}

export default function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lease" element={<Lease />} />
      </Routes>
    </SessionProvider>
  )
}
