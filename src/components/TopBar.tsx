export default function TopBar() {
  return (
    <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shrink-0">
      <div className="text-sm text-neutral-500">Workspace: Demo Workspace</div>
      <div className="flex items-center gap-3">
        <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
          Live
        </span>
        <div className="w-8 h-8 rounded-full bg-neutral-200" />
      </div>
    </header>
  )
}
