import { useEffect, useState } from 'react'
import {
  Layout,
  Button,
  LoadingState,
  ErrorState,
  EmptyState,
  SetupBanner,
} from '../components/Layout'
import {
  addShoppingItem,
  clearCheckedItems,
  fetchShoppingList,
  removeShoppingItem,
  updateShoppingItem,
} from '../lib/api/shoppingList'
import { fetchMenuRecipesWithDetails } from '../lib/api/menu'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  INGREDIENT_CATEGORIES,
  QUANTITY_UNITS,
  scaleQuantity,
  type IngredientCategory,
  type ShoppingListItem,
} from '../lib/types'

export function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<IngredientCategory>('other')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('piece')

  async function load() {
    setError(null)
    try {
      setItems(await fetchShoppingList())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shopping list')
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

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return

    setBusy(true)
    try {
      await addShoppingItem(name, category, quantity, unit)
      setName('')
      setQuantity(1)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
    } finally {
      setBusy(false)
    }
  }

  async function toggleChecked(item: ShoppingListItem) {
    try {
      await updateShoppingItem(item.id, { checked: !item.checked })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item')
    }
  }

  async function changeQuantity(item: ShoppingListItem, value: number) {
    try {
      await updateShoppingItem(item.id, { quantity_value: Math.max(0, value) })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity')
    }
  }

  async function changeUnit(item: ShoppingListItem, quantity_unit: string) {
    try {
      await updateShoppingItem(item.id, { quantity_unit })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update unit')
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeShoppingItem(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item')
    }
  }

  async function importFromMenu() {
    setBusy(true)
    setError(null)
    try {
      const recipes = await fetchMenuRecipesWithDetails()
      if (!recipes.length) {
        setError('Your menu is empty. Generate a menu first.')
        return
      }

      for (const recipe of recipes) {
        for (const ri of recipe.recipe_ingredients) {
          if (!ri.ingredient) continue
          await addShoppingItem(
            ri.ingredient.name,
            ri.ingredient.category,
            scaleQuantity(Number(ri.quantity_value), recipe.servings, recipe.servings),
            ri.quantity_unit,
          )
        }
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import from menu')
    } finally {
      setBusy(false)
    }
  }

  async function handleClearChecked() {
    setBusy(true)
    try {
      await clearCheckedItems()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear checked items')
    } finally {
      setBusy(false)
    }
  }

  const unchecked = items.filter((i) => !i.checked)
  const checked = items.filter((i) => i.checked)

  return (
    <Layout
      title="Shopping list"
      action={
        <div className="header-actions">
          <Button variant="secondary" onClick={importFromMenu} disabled={busy}>
            From menu
          </Button>
          {checked.length > 0 && (
            <Button variant="ghost" onClick={handleClearChecked} disabled={busy}>
              Clear done
            </Button>
          )}
        </div>
      }
    >
      {!isSupabaseConfigured && <SetupBanner />}
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      <form className="card add-item-form" onSubmit={handleAdd}>
        <h2>Add item</h2>
        <div className="form-grid">
          <label className="field span-2">
            Ingredient
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Milk"
            />
          </label>
          <label className="field">
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value as IngredientCategory)}>
              {INGREDIENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Qty
            <input
              type="number"
              min={0}
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 0)}
            />
          </label>
          <label className="field">
            Unit
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              {QUANTITY_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Button type="submit" disabled={busy || !name.trim()}>
          Add to list
        </Button>
      </form>

      {!loading && items.length === 0 && (
        <EmptyState message="Your shopping list is empty." />
      )}

      {unchecked.length > 0 && (
        <section className="card">
          <h2>To buy</h2>
          <ul className="shopping-list">
            {unchecked.map((item) => (
              <ShoppingRow
                key={item.id}
                item={item}
                onToggle={() => toggleChecked(item)}
                onQuantityChange={(v) => changeQuantity(item, v)}
                onUnitChange={(u) => changeUnit(item, u)}
                onRemove={() => handleRemove(item.id)}
              />
            ))}
          </ul>
        </section>
      )}

      {checked.length > 0 && (
        <section className="card checked-section">
          <h2>Done</h2>
          <ul className="shopping-list">
            {checked.map((item) => (
              <ShoppingRow
                key={item.id}
                item={item}
                onToggle={() => toggleChecked(item)}
                onQuantityChange={(v) => changeQuantity(item, v)}
                onUnitChange={(u) => changeUnit(item, u)}
                onRemove={() => handleRemove(item.id)}
              />
            ))}
          </ul>
        </section>
      )}
    </Layout>
  )
}

function ShoppingRow({
  item,
  onToggle,
  onQuantityChange,
  onUnitChange,
  onRemove,
}: {
  item: ShoppingListItem
  onToggle: () => void
  onQuantityChange: (value: number) => void
  onUnitChange: (unit: string) => void
  onRemove: () => void
}) {
  return (
    <li className={`shopping-row ${item.checked ? 'checked' : ''}`}>
      <label className="checkbox-label">
        <input type="checkbox" checked={item.checked} onChange={onToggle} />
        <span>{item.ingredient?.name ?? 'Unknown'}</span>
      </label>
      <div className="shopping-controls">
        <input
          type="number"
          min={0}
          step="any"
          value={item.quantity_value}
          onChange={(e) => onQuantityChange(Number(e.target.value) || 0)}
          aria-label={`Quantity for ${item.ingredient?.name}`}
        />
        <select
          value={item.quantity_unit}
          onChange={(e) => onUnitChange(e.target.value)}
          aria-label={`Unit for ${item.ingredient?.name}`}
        >
          {QUANTITY_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <span className="muted">{item.ingredient?.category}</span>
        <Button type="button" variant="ghost" onClick={onRemove}>
          Remove
        </Button>
      </div>
    </li>
  )
}
