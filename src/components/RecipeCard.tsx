import { Link } from 'react-router-dom'
import type { Recipe } from '../lib/types'
import { formatDuration } from '../lib/types'

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link to={`/recipes/${recipe.id}`} className="recipe-card">
      <div>
        <h2 className="recipe-card-title">{recipe.name}</h2>
        <p className="recipe-card-meta">
          {formatDuration(recipe.prep_duration_minutes, recipe.cook_duration_minutes)}
        </p>
        <p className="recipe-card-meta">{recipe.servings} servings</p>
      </div>
      <span className="recipe-card-arrow" aria-hidden>
        →
      </span>
    </Link>
  )
}
