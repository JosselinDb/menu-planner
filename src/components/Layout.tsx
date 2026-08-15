import { Link } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  action?: React.ReactNode
}

const navItems = [
  { to: '/', label: 'Recipes', icon: '📖' },
  { to: '/menu', label: 'Menu', icon: '📅' },
  { to: '/shopping', label: 'Shopping', icon: '🛒' },
]

export function Layout({ children, title, action }: LayoutProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <div>
            <p className="app-brand">Menu Planner</p>
            {title && <h1 className="page-title">{title}</h1>}
          </div>
          {action}
        </div>
      </header>

      <main className="app-main">{children}</main>

      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <Link key={item.to} to={item.to} className="bottom-nav-link">
            <span className="bottom-nav-icon" aria-hidden>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

export function SetupBanner() {
  return (
    <div className="setup-banner">
      <strong>Supabase not configured.</strong> Copy <code>.env.example</code> to{' '}
      <code>.env</code>, add your project URL and anon key, then restart the dev server.
      See <code>README.md</code> for setup steps.
    </div>
  )
}

export function LoadingState() {
  return <p className="muted center">Loading…</p>
}

export function ErrorState({ message }: { message: string }) {
  return <p className="error center">{message}</p>
}

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <p>{message}</p>
      {action}
    </div>
  )
}

export function Button({
  children,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}) {
  return (
    <button className={`btn btn-${variant}`} {...props}>
      {children}
    </button>
  )
}

export function LinkButton({
  to,
  children,
  variant = 'primary',
}: {
  to: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}) {
  return (
    <Link to={to} className={`btn btn-${variant}`}>
      {children}
    </Link>
  )
}
