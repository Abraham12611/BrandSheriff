export default function PrototypeBanner() {
  return (
    <div
      role="alert"
      className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-800"
    >
      <span className="font-semibold">Read-only prototype.</span>{' '}
      Authentication and workspace tenancy are now active. Provider-driven actions
      (crawl, send, forensics) remain gated until their contracts are verified. Do not add
      company data or treat the displayed case data as verified.
    </div>
  )
}
