import PrototypeBanner from './PrototypeBanner'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <PrototypeBanner />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
