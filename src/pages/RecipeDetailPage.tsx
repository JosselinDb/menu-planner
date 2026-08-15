import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Layout,
  LoadingState,
  ErrorState,
  Button,
  SetupBanner,
} from '../components/Layout'
import { deleteRecipe, fetchRecipe } from '../lib/api/recipes'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  formatDuration,
  formatQuantity,
  scaleQuantity,
  type RecipeWithDetails,
} from '../lib/types'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null)
  const [servings, setServings] = useState(4)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id || !isSupabaseConfigured) {
      setLoading(false)
      return
    }

    fetchRecipe(id)
      .then((data) => {
        setRecipe(data)
        setServings(data.servings)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!recipe || !window.confirm(`Delete "${recipe.name}"?`)) return
    setDeleting(true)
    try {
      await deleteRecipe(recipe.id)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
      setDeleting(false)
    }
  }

  return (
    <Layout
      title={recipe?.name ?? 'Recipe'}
      action={
        recipe && (
          <div className="header-actions">
            <Link to={`/recipes/${recipe.id}/edit`} className="btn btn-secondary">
              Edit
            </Link>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        )
      }
    >
      {!isSupabaseConfigured && <SetupBanner />}
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {recipe && (
        <article className="recipe-detail">
          <Link to="/" className="back-link">
            ← All recipes
          </Link>

          <div className="detail-grid">
            <section className="card">
              <h2>Overview</h2>
              <dl className="detail-list">
                <div>
                  <dt>Duration</dt>
                  <dd>
                    {formatDuration(recipe.prep_duration_minutes, recipe.cook_duration_minutes)}
                  </dd>
                </div>
                <div>
                  <dt>Base servings</dt>
                  <dd>{recipe.servings}</dd>
                </div>
                {recipe.source_link && (
                  <div>
                    <dt>Source</dt>
                    <dd>
                      <a href={recipe.source_link} target="_blank" rel="noreferrer">
                        Open link
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="card">
              <div className="section-header">
                <h2>Ingredients</h2>
                <label className="servings-control">
                  For
                  <input
                    type="number"
                    min={1}
                    value={servings}
                    onChange={(e) => setServings(Math.max(1, Number(e.target.value) || 1))}
                  />
                  people
                </label>
              </div>
              <ul className="ingredient-list">
                {recipe.recipe_ingredients.map((ri) => (
                  <li key={ri.id}>
                    <span>{ri.ingredient?.name ?? 'Unknown'}</span>
                    <span className="quantity">
                      {formatQuantity(
                        scaleQuantity(Number(ri.quantity_value), recipe.servings, servings),
                        ri.quantity_unit,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card">
              <h2>Instructions</h2>
              <ol className="instruction-list">
                {recipe.recipe_instructions.map((step) => (
                  <li key={step.id}>{step.instruction_text}</li>
                ))}
              </ol>
            </section>
          </div>
        </article>
      )}
    </Layout>
  )
}
