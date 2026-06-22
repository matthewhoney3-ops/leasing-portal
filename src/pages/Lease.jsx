import { useState } from 'react'
import { Packer } from 'docx'
import BrandMark from '../components/Brand.jsx'
import { buildLeaseDocument } from '../lib/leaseTemplate.js'
import { LEASE_PROPERTIES } from '../lib/leaseProperties.js'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateLong(isoDate) {
  if (!isoDate) return ''
  const d = new Date(`${isoDate}T00:00:00`)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const initialForm = {
  landlordName: 'Golden Hive Capital',
  propertyChoice: LEASE_PROPERTIES[0].id,
  propertyLabel: LEASE_PROPERTIES[0].label,
  propertyAddress: LEASE_PROPERTIES[0].address,
  tenantNames: '',
  additionalOccupants: '',
  leaseStartDate: '',
  leaseEndDate: '',
  monthlyRent: '',
  rentDueDay: '1',
  lateFeeAmount: '',
  gracePeriodDays: '5',
  securityDeposit: '',
  petDeposit: '',
  petPolicy: '',
  utilitiesTenantPays: '',
  utilitiesLandlordPays: '',
  agreementDate: todayIso(),
}

export default function Lease() {
  const [form, setForm] = useState(initialForm)
  const [generating, setGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handlePropertyChoice(id) {
    if (id === 'custom') {
      updateField('propertyChoice', 'custom')
      return
    }
    const match = LEASE_PROPERTIES.find((p) => p.id === id)
    setForm((prev) => ({
      ...prev,
      propertyChoice: id,
      propertyLabel: match ? match.label : prev.propertyLabel,
      propertyAddress: match ? match.address : prev.propertyAddress,
    }))
  }

  async function handleGenerate(event) {
    event.preventDefault()
    setErrorMessage('')

    if (!form.tenantNames.trim() || !form.leaseStartDate || !form.leaseEndDate || !form.monthlyRent) {
      setErrorMessage('Tenant name(s), lease start/end dates, and monthly rent are required.')
      return
    }

    setGenerating(true)
    try {
      const doc = buildLeaseDocument({
        landlordName: form.landlordName.trim(),
        propertyLabel: form.propertyLabel.trim(),
        propertyAddress: form.propertyAddress.trim(),
        tenantNames: form.tenantNames.trim(),
        additionalOccupants: form.additionalOccupants.trim(),
        leaseStartDate: formatDateLong(form.leaseStartDate),
        leaseEndDate: formatDateLong(form.leaseEndDate),
        monthlyRent: form.monthlyRent,
        rentDueDay: form.rentDueDay,
        lateFeeAmount: form.lateFeeAmount,
        gracePeriodDays: form.gracePeriodDays,
        securityDeposit: form.securityDeposit,
        petDeposit: form.petDeposit,
        petPolicy: form.petPolicy.trim(),
        utilitiesTenantPays: form.utilitiesTenantPays.trim(),
        utilitiesLandlordPays: form.utilitiesLandlordPays.trim(),
        agreementDate: formatDateLong(form.agreementDate),
      })

      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const safeTenant = form.tenantNames.trim().replace(/[^a-z0-9]+/gi, '-')
      const safeProperty = form.propertyLabel.trim().replace(/[^a-z0-9]+/gi, '-')
      a.href = url
      a.download = `Lease - ${safeTenant} - ${safeProperty}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      setErrorMessage('Something went wrong generating the document. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <BrandMark />
      <div className="mt-10 w-full max-w-2xl">
        <h1 className="text-2xl font-medium">Lease producer</h1>
        <p className="mt-2 text-sm text-amber-400">
          This generates a starting-point lease, not a finished legal document. Have an
          Arizona-licensed attorney review the language — especially the security deposit and
          entry-notice sections — before sending it to a tenant.
        </p>

        <form onSubmit={handleGenerate} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-sm text-neutral-300">Property</label>
              <select
                value={form.propertyChoice}
                onChange={(e) => handlePropertyChoice(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              >
                {LEASE_PROPERTIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
                <option value="custom">Other / custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-neutral-300">Property label</label>
              <input
                type="text"
                value={form.propertyLabel}
                onChange={(e) => updateField('propertyLabel', e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-300">Property address</label>
              <input
                type="text"
                value={form.propertyAddress}
                onChange={(e) => updateField('propertyAddress', e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-300">Landlord name</label>
              <input
                type="text"
                value={form.landlordName}
                onChange={(e) => updateField('landlordName', e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-300">Agreement date</label>
              <input
                type="date"
                value={form.agreementDate}
                onChange={(e) => updateField('agreementDate', e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm text-neutral-300">Tenant name(s)</label>
              <input
                type="text"
                required
                placeholder="Jane Doe and John Smith"
                value={form.tenantNames}
                onChange={(e) => updateField('tenantNames', e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm text-neutral-300">
                Additional occupants (optional)
              </label>
              <input
                type="text"
                value={form.additionalOccupants}
                onChange={(e) => updateField('additionalOccupants', e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-300">Lease start date</label>
              <input
                type="date"
                required
                value={form.leaseStartDate}
                onChange={(e) => updateField('leaseStartDate', e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-300">Lease end date</label>
              <input
                type="date"
                required
                value={form.leaseEndDate}
                onChange={(e) => updateField('leaseEndDate', e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-300">Monthly rent ($)</label>
              <input
                type="number"
                required
                value={form.monthlyRent}
                onChange={(e) => updateField('monthlyRent', e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-300">Rent due day</label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.rentDueDay}
                onChange={(e) => updateField('rentDueDay', e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-300">Late fee ($, optional)</label>
              <input
                type="number"
                value={form.lateFeeAmount}
                onChange={(e) => updateField('lateFeeAmount', e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-300">Grace period (days)</label>
              <input
                type="number"
                value={form.gracePeriodDays}
                onChange={(e) => updateField('gracePeriodDays', e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-300">Security deposit ($)</label>
              <input
                type="number"
                required
                value={form.securityDeposit}
                onChange={(e) => updateField('securityDeposit', e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-300">Pet deposit ($, optional)</label>
              <input
                type="number"
                value={form.petDeposit}
                onChange={(e) => updateField('petDeposit', e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm text-neutral-300">Pet policy (optional)</label>
              <textarea
                rows={2}
                placeholder="Leave blank to default to no pets allowed"
                value={form.petPolicy}
                onChange={(e) => updateField('petPolicy', e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-300">Tenant pays utilities</label>
              <input
                type="text"
                placeholder="Electric, Internet"
                value={form.utilitiesTenantPays}
                onChange={(e) => updateField('utilitiesTenantPays', e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-neutral-300">Landlord pays utilities</label>
              <input
                type="text"
                placeholder="Water, Sewer, Trash"
                value={form.utilitiesLandlordPays}
                onChange={(e) => updateField('utilitiesLandlordPays', e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none"
              />
            </div>
          </div>

          {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

          <button
            type="submit"
            disabled={generating}
            className="w-full rounded-md bg-gold-gradient px-5 py-2 text-sm font-medium text-neutral-900 disabled:opacity-60"
          >
            {generating ? 'Generating…' : 'Generate lease (.docx)'}
          </button>
        </form>
      </div>
    </div>
  )
}
