import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import AppShell from './components/AppShell'
import AuthGate from './components/AuthGate'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import BrandDNA from './pages/BrandDNA'
import Patrols from './pages/Patrols'
import Cases from './pages/Cases'
import CaseDetail from './pages/CaseDetail'
import { WorkspaceProvider } from './lib/workspace'

function App() {
  return (
    <HashRouter>
      <AuthGate>
        <WorkspaceProvider>
          <AppShell>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/brand" element={<BrandDNA />} />
              <Route path="/patrols" element={<Patrols />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/cases/:id" element={<CaseDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </WorkspaceProvider>
      </AuthGate>
    </HashRouter>
  )
}

function NotFound() {
  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg border border-neutral-200 p-8">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-neutral-600 mt-2">
        The requested page is not available in this prototype.
      </p>
      <Link
        to="/dashboard"
        className="inline-block mt-6 px-4 py-2 bg-neutral-900 text-white rounded-md text-sm font-medium hover:bg-neutral-800"
      >
        Return to Command Center
      </Link>
    </div>
  )
}

export default App
