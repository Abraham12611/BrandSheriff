import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

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
  UserButton: () => <div data-testid="clerk-user-button">User</div>,
}))

beforeEach(() => {
  mockAuth.isAuthenticated = true
  window.location.hash = '#/dashboard'
})

describe('authenticated navigation and safety disclosure', () => {
  it('prompts to create a workspace when the user has none', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: 'Set up workspace' })).toHaveAttribute('href', '#/onboarding')
  })

  it('does not claim a live or unauthenticated workspace', () => {
    render(<App />)
    expect(screen.queryByText('Live', { exact: true })).not.toBeInTheDocument()
    expect(screen.queryByText('Workspace: Demo Workspace')).not.toBeInTheDocument()
    expect(screen.getByText('Auth-enabled prototype', { exact: true })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Do not add company data')
  })

  it('does not expose demo seeding in the main dashboard', () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: /Load Northstar demo/i })).not.toBeInTheDocument()
  })

  it('renders an explicit unknown-route state', () => {
    window.location.hash = '#/does-not-exist'
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Return to Command Center' })).toHaveAttribute('href', '#/dashboard')
  })

  it('shows a real onboarding form but requires workspace details', () => {
    window.location.hash = '#/onboarding'
    render(<App />)
    const submit = screen.getByRole('button', { name: 'Create workspace' })
    expect(submit).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Workspace name'), { target: { value: 'Northstar' } })
    expect(submit).not.toBeDisabled()
  })

  it('gates the app behind authentication when signed out', () => {
    mockAuth.isAuthenticated = false
    render(<App />)
    expect(screen.getByTestId('clerk-sign-in')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Set up workspace' })).not.toBeInTheDocument()
  })
})
