import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App, { AppRoutes } from './App'
import AuthGate from './components/AuthGate'

const mockAuth = vi.hoisted(() => ({
  isAuthenticated: true,
}))

vi.mock('convex/react', () => ({
  useQuery: vi.fn(() => []),
  useMutation: vi.fn(() => vi.fn()),
  useAction: vi.fn(() => vi.fn()),
  useConvexAuth: vi.fn(() => ({
    isLoading: false,
    isAuthenticated: mockAuth.isAuthenticated,
  })),
}))

vi.mock('@clerk/react', () => ({
  useAuth: vi.fn(() => ({
    isLoaded: true,
    isSignedIn: mockAuth.isAuthenticated,
    getToken: vi.fn(async () => null),
  })),
  useOrganization: vi.fn(() => ({
    isLoaded: true,
    organization: null,
    membership: null,
  })),
  SignIn: () => <div data-testid="clerk-sign-in">Sign in</div>,
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserButton: () => <div data-testid="clerk-user-button">User</div>,
}))

beforeEach(() => {
  mockAuth.isAuthenticated = true
})

function renderWithRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('authenticated navigation and safety disclosure', () => {
  it('prompts to create a workspace when the user has none', () => {
    renderWithRoute('/dashboard')
    expect(screen.getByRole('link', { name: 'Set up workspace' })).toHaveAttribute('href', '/onboarding')
  })

  it('does not claim a live or unauthenticated workspace', () => {
    renderWithRoute('/dashboard')
    expect(screen.queryByText('Live', { exact: true })).not.toBeInTheDocument()
    expect(screen.queryByText('Workspace: Demo Workspace')).not.toBeInTheDocument()
    expect(screen.getByText('Auth-enabled prototype', { exact: true })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Do not add company data')
  })

  it('does not expose demo seeding in the main dashboard', () => {
    renderWithRoute('/dashboard')
    expect(screen.queryByRole('button', { name: /Load Northstar demo/i })).not.toBeInTheDocument()
  })

  it('renders an explicit unknown-route state', () => {
    renderWithRoute('/does-not-exist')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Return to Command Center' })).toHaveAttribute('href', '/dashboard')
  })

  it('shows a real onboarding form but requires workspace details', () => {
    renderWithRoute('/onboarding')
    const submit = screen.getByRole('button', { name: 'Create workspace' })
    expect(submit).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Workspace name'), { target: { value: 'Northstar' } })
    expect(submit).not.toBeDisabled()
  })

  it('shows the public scan landing to signed-out visitors', () => {
    mockAuth.isAuthenticated = false
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /who's copying your brand/i }),
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText('yourstore.com')).toBeInTheDocument()
  })

  it('gates the app behind authentication when signed out', () => {
    mockAuth.isAuthenticated = false
    render(
      <MemoryRouter>
        <AuthGate>
          <div data-testid="protected-app">app</div>
        </AuthGate>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('clerk-sign-in')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-app')).not.toBeInTheDocument()
  })
})
