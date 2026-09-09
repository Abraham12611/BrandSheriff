import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/AppShell'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import BrandDNA from './pages/BrandDNA'
import Patrols from './pages/Patrols'
import Cases from './pages/Cases'
import CaseDetail from './pages/CaseDetail'

function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/brand" element={<BrandDNA />} />
          <Route path="/patrols" element={<Patrols />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
        </Routes>
      </AppShell>
    </HashRouter>
  )
}

export default App
