import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Layout, Button, LoadingState, ErrorState, SetupBanner } from '../components/Layout'
import { createRecipe, fetchRecipe, recipeToFormData, updateRecipe } from '../lib/api/recipes'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  INGREDIENT_CATEGORIES,
  QUANTITY_UNITS,
  type IngredientCategory,
  type RecipeFormData,
} from '../lib/types'

const emptyIngredient = (): RecipeFormData['ingredients'][0] => ({
  ingredient_name: '',
  ingredient_category: 'other',
  quantity_value: 1,
  quantity_unit: 'g',
})

const defaultForm = (): RecipeFormData => ({
  name: '',
  source_link: '',
  prep_duration_minutes: 15,
  cook_duration_minutes: 30,
  servings: 4,
  ingredients: [emptyIngredient()],
  instructions: [''],
})

export function RecipeFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState<RecipeFormData>(defaultForm())
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !isSupabaseConfigured) {
      setLoading(false)
      return
    }

    fetchRecipe(id)
      .then((recipe) => setForm(recipeToFormData(recipe)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  function updateField<K extends keyof RecipeFormData>(key: K, value: RecipeFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateIngredient(index: number, patch: Partial<RecipeFormData['ingredients'][0]>) {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }))
  }

  function updateInstruction(index: number, value: string) {
    setForm((prev) => ({
      ...prev,
      instructions: prev.instructions.map((step, i) => (i === index ? value : step)),
    }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.name.trim()) {
      setError('Recipe name is required.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (isEdit && id) {
        await updateRecipe(id, form)
        navigate(`/recipes/${id}`)
      } else {
        const newId = await createRecipe(form)
        navigate(`/recipes/${newId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe')
      setSaving(false)
    }
  }

  return (
    <Layout title={isEdit ? 'Edit recipe' : 'Add recipe'}>
      {!isSupabaseConfigured && <SetupBanner />}
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && (
        <form className="recipe-form" onSubmit={handleSubmit}>
          <Link to={isEdit && id ? `/recipes/${id}` : '/'} className="back-link">
            ← Cancel
          </Link>

          <section className="card">
            <h2>Basics</h2>
            <div className="form-grid">
              <label className="field span-2">
                Name
                <input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Chicken stir-fry"
                  required
                />
              </label>
              <label className="field span-2">
                Source link
                <input
                  type="url"
                  value={form.source_link}
                  onChange={(e) => updateField('source_link', e.target.value)}
                  placeholder="https://..."
                />
              </label>
              <label className="field">
                Prep (min)
                <input
                  type="number"
                  min={0}
                  value={form.prep_duration_minutes}
                  onChange={(e) =>
                    updateField('prep_duration_minutes', Number(e.target.value) || 0)
                  }
                />
              </label>
              <label className="field">
                Cook (min)
                <input
                  type="number"
                  min={0}
                  value={form.cook_duration_minutes}
                  onChange={(e) =>
                    updateField('cook_duration_minutes', Number(e.target.value) || 0)
                  }
                />
              </label>
              <label className="field">
                Servings
                <input
                  type="number"
                  min={1}
                  value={form.servings}
                  onChange={(e) => updateField('servings', Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
            </div>
          </section>

          <section className="card">
            <div className="section-header">
              <h2>Ingredients</h2>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  updateField('ingredients', [...form.ingredients, emptyIngredient()])
                }
              >
                + Add ingredient
              </Button>
            </div>

            {form.ingredients.map((item, index) => (
              <div key={index} className="ingredient-row">
                <label className="field">
                  Name
                  <input
                    value={item.ingredient_name}
                    onChange={(e) => updateIngredient(index, { ingredient_name: e.target.value })}
                    placeholder="Tomato"
                  />
                </label>
                <label className="field">
                  Category
                  <select
                    value={item.ingredient_category}
                    onChange={(e) =>
                      updateIngredient(index, {
                        ingredient_category: e.target.value as IngredientCategory,
                      })
                    }
                  >
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
                    value={item.quantity_value}
                    onChange={(e) =>
                      updateIngredient(index, { quantity_value: Number(e.target.value) || 0 })
                    }
                  />
                </label>
                <label className="field">
                  Unit
                  <select
                    value={item.quantity_unit}
                    onChange={(e) => updateIngredient(index, { quantity_unit: e.target.value })}
                  >
                    {QUANTITY_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </label>
                {form.ingredients.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      updateField(
                        'ingredients',
                        form.ingredients.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </section>

          <section className="card">
            <div className="section-header">
              <h2>Instructions</h2>
              <Button
                type="button"
                variant="secondary"
                onClick={() => updateField('instructions', [...form.instructions, ''])}
              >
                + Add step
              </Button>
            </div>

            {form.instructions.map((step, index) => (
              <div key={index} className="instruction-row">
                <span className="step-number">{index + 1}.</span>
                <textarea
                  value={step}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  placeholder="Describe this step…"
                  rows={2}
                />
                {form.instructions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      updateField(
                        'instructions',
                        form.instructions.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </section>

          <div className="form-actions">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create recipe'}
            </Button>
          </div>
        </form>
      )}
    </Layout>
  )
}
