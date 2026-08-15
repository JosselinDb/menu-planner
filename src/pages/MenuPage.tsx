import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Layout,
  Button,
  LoadingState,
  ErrorState,
  EmptyState,
  SetupBanner,
} from '../components/Layout'
import {
  clearMenu,
  fetchMenu,
  generateMenu,
  removeMenuItem,
  replaceMenuSlot,
} from '../lib/api/menu'
import { isSupabaseConfigured } from '../lib/supabase'
import { formatDuration, type MenuItem } from '../lib/types'

const MENU_SIZE = 7

export function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    setError(null)
    try {
      setItems(await fetchMenu())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    load()
  }, [])

  async function handleGenerate() {
    setBusy(true)
    setError(null)
    try {
      await generateMenu(MENU_SIZE)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate menu')
    } finally {
      setBusy(false)
    }
  }

  async function handleReplace(id: string) {
    setBusy(true)
    try {
      await replaceMenuSlot(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replace recipe')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeMenuItem(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item')
    }
  }

  async function handleClear() {
    if (!window.confirm('Clear the entire menu?')) return
    setBusy(true)
    try {
      await clearMenu()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear menu')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout
      title="Weekly menu"
      action={
        items.length > 0 ? (
          <Button variant="ghost" onClick={handleClear} disabled={busy}>
            Clear
          </Button>
        ) : undefined
      }
    >
      {!isSupabaseConfigured && <SetupBanner />}

      <section className="card menu-actions">
        <p className="muted">
          Generate a {MENU_SIZE}-day menu from your recipes. Tap shuffle on any day to swap it.
        </p>
        <Button onClick={handleGenerate} disabled={busy}>
          {busy ? 'Working…' : items.length ? 'Regenerate menu' : 'Generate menu'}
        </Button>
      </section>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && items.length === 0 && (
        <EmptyState message="No menu yet. Hit the button above to plan your week." />
      )}

      <ul className="menu-list">
        {items.map((item, index) => (
          <li key={item.id} className="card menu-item">
            <div className="menu-item-header">
              <div>
                <p className="menu-day">
                  {item.menu_date
                    ? new Date(item.menu_date + 'T12:00:00').toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })
                    : `Day ${index + 1}`}
                </p>
                {item.recipe && (
                  <>
                    <Link to={`/recipes/${item.recipe.id}`} className="menu-recipe-link">
                      <h2>{item.recipe.name}</h2>
                    </Link>
                    <p className="muted">
                      {formatDuration(
                        item.recipe.prep_duration_minutes,
                        item.recipe.cook_duration_minutes,
                      )}{' '}
                      · {item.recipe.servings} servings
                    </p>
                  </>
                )}
              </div>
              <div className="menu-item-actions">
                <Button variant="secondary" onClick={() => handleReplace(item.id)} disabled={busy}>
                  Shuffle
                </Button>
                <Button variant="ghost" onClick={() => handleRemove(item.id)} disabled={busy}>
                  Remove
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Layout>
  )
}
