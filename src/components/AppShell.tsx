import PrototypeBanner from './PrototypeBanner'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas text-neutral-900 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pt-16 lg:pt-0">
        <TopBar />
        <PrototypeBanner />
        <main id="main-content" className="flex-1 overflow-auto p-4 sm:p-6" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  )
}
