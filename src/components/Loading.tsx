export default function Loading({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-sm text-neutral-500">
      <div className="w-8 h-8 border-4 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mb-3" />
      {message}
    </div>
  )
}
