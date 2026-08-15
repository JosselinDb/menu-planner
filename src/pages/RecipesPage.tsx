import { useEffect, useState } from 'react'
import { Layout, LoadingState, ErrorState, EmptyState, LinkButton, SetupBanner } from '../components/Layout'
import { RecipeCard } from '../components/RecipeCard'
import { fetchRecipes } from '../lib/api/recipes'
import { isSupabaseConfigured } from '../lib/supabase'
import type { Recipe } from '../lib/types'

export function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    fetchRecipes()
      .then(setRecipes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout
      title="Recipes"
      action={<LinkButton to="/recipes/new">+ Add recipe</LinkButton>}
    >
      {!isSupabaseConfigured && <SetupBanner />}
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && recipes.length === 0 && (
        <EmptyState
          message="No recipes yet. Add your first one!"
          action={<LinkButton to="/recipes/new">Add recipe</LinkButton>}
        />
      )}
      <ul className="recipe-list">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <RecipeCard recipe={recipe} />
          </li>
        ))}
      </ul>
    </Layout>
  )
}
