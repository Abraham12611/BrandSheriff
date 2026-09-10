import { useState } from 'react'

export default function Onboarding() {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg border border-neutral-200 p-8">
      <h1 className="text-2xl font-bold">Onboard your brand</h1>
      <p className="text-neutral-600 mt-2">Add the official brand so BrandSheriff can build your Brand DNA.</p>

      <div className="mt-6 p-4 bg-amber-50 text-amber-800 rounded-md text-sm">
        Onboarding is disabled in the read-only prototype. Authentication and workspace
        controls are required before real brand data can be added.
      </div>

      <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Brand name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-neutral-50"
            placeholder="Northstar Atelier"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Official domain</label>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            disabled
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-neutral-50"
            placeholder="https://northstaratelier.com"
          />
        </div>
        <button
          type="submit"
          disabled
          className="px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
        >
          Build Brand DNA
        </button>
      </form>
    </div>
  )
}
