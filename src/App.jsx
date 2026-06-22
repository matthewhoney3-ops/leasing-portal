import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Apply from './pages/Apply.jsx'
import Lease from './pages/Lease.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/apply" element={<Apply />} />
      <Route path="/lease" element={<Lease />} />
    </Routes>
  )
}
