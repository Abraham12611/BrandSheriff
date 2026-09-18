import { BrowserRouter, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom'
import AppShell from './components/AppShell'
import AuthGate from './components/AuthGate'
import WorkspaceRequired from './components/WorkspaceRequired'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import BrandProfile from './pages/BrandProfile'
import Discoveries from './pages/Discoveries'
import Cases from './pages/Cases'
import CaseDetail from './pages/CaseDetail'
import Enforcement from './pages/Enforcement'
import People from './pages/People'
import Settings from './pages/Settings'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import ReportView from './pages/ReportView'
import Landing from './pages/Landing'
import { WorkspaceProvider } from './lib/workspace'
import { ToastProvider } from './components/Toasts'

function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export function AppRoutes() {
  return (
    <WorkspaceProvider>
      <ToastProvider>
        <Routes>
          <Route element={<ShellLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route
              path="/brand"
              element={
                <WorkspaceRequired>
                  <BrandProfile />
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
              path="/analytics"
              element={
                <WorkspaceRequired>
                  <Analytics />
                </WorkspaceRequired>
              }
            />
            <Route
              path="/reports"
              element={
                <WorkspaceRequired>
                  <Reports />
                </WorkspaceRequired>
              }
            />
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
            <Route
              path="/enforcement"
              element={
                <WorkspaceRequired>
                  <Enforcement />
                </WorkspaceRequired>
              }
            />
            <Route
              path="/people"
              element={
                <WorkspaceRequired>
                  <People />
                </WorkspaceRequired>
              }
            />
            <Route
              path="/settings"
              element={
                <WorkspaceRequired>
                  <Settings />
                </WorkspaceRequired>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ToastProvider>
    </WorkspaceProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public share-link view — no auth, no app shell */}
        <Route path="/report/:token" element={<ReportView />} />
        {/* Public landing + free scan — redirects authed users to the app */}
        <Route path="/" element={<Landing />} />
        <Route
          path="/*"
          element={
            <AuthGate>
              <AppRoutes />
            </AuthGate>
          }
        />
      </Routes>
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
