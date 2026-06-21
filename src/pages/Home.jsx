import { Link } from 'react-router-dom'
import BrandMark from '../components/Brand.jsx'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <BrandMark />
      <h1 className="mt-8 text-2xl font-medium">Tenant applications &amp; leasing</h1>
      <p className="mt-3 max-w-md text-neutral-400">
        Looking to apply for a Golden Hive Capital rental? Use the{' '}
        <span className="text-gold-mid">Apply now</span> link on the property listing to get
        started.
      </p>
      <Link
        to="/apply"
        className="mt-8 rounded-md bg-gold-gradient px-5 py-2 text-sm font-medium text-neutral-900"
      >
        Start an application
      </Link>
    </div>
  )
}
