import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import AppShell from './components/AppShell'
import AuthGate from './components/AuthGate'
import WorkspaceRequired from './components/WorkspaceRequired'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import BrandDNA from './pages/BrandDNA'
import Discoveries from './pages/Discoveries'
import Cases from './pages/Cases'
import CaseDetail from './pages/CaseDetail'
import { WorkspaceProvider } from './lib/workspace'

export function AppRoutes() {
  return (
    <WorkspaceProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route
            path="/brand"
            element={
              <WorkspaceRequired>
                <BrandDNA />
              </WorkspaceRequired>
            }
          />
          <Route
            path="/discoveries"
            element={
              <WorkspaceRequired>
                <Discoveries />
              </WorkspaceRequired>
            }
          />
          <Route path="/patrols" element={<Navigate to="/discoveries" replace />} />
          <Route
            path="/cases"
            element={
              <WorkspaceRequired>
                <Cases />
              </WorkspaceRequired>
            }
          />
          <Route
            path="/cases/:id"
            element={
              <WorkspaceRequired>
                <CaseDetail />
              </WorkspaceRequired>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
    </WorkspaceProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <AppRoutes />
      </AuthGate>
    </BrowserRouter>
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
