export default function PrototypeBanner() {
  return (
    <div
      role="alert"
      className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-800"
    >
      <span className="font-semibold">Read-only prototype.</span>{' '}
      Do not add company data or treat the displayed case data as verified. Authentication,
      tenancy, and approval controls are not yet implemented.
    </div>
  )
}
