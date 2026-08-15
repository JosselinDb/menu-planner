import { supabase } from '../supabase'
import { deleteRecipeImageByUrl, uploadRecipeImage } from './storage'
import { findOrCreateIngredient } from './ingredients'
import type {
  Recipe,
  RecipeFormData,
  RecipeImageInput,
  RecipeWithDetails,
} from '../types'

const recipeSelect = `
  *,
  recipe_ingredients (
    *,
    ingredient:ingredients (*)
  ),
  recipe_instructions (*)
`

export async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('name')

  if (error) throw error
  return (data ?? []) as Recipe[]
}

export async function fetchRecipe(id: string): Promise<RecipeWithDetails> {
  const { data, error } = await supabase
    .from('recipes')
    .select(recipeSelect)
    .eq('id', id)
    .single()

  if (error) throw error

  const recipe = data as RecipeWithDetails
  recipe.recipe_ingredients.sort((a, b) => a.sort_order - b.sort_order)
  recipe.recipe_instructions.sort((a, b) => a.step_number - b.step_number)
  return recipe
}

export async function createRecipe(
  form: RecipeFormData,
  image?: RecipeImageInput,
): Promise<string> {
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      name: form.name.trim(),
      source_link: form.source_link.trim() || null,
      prep_duration_minutes: form.prep_duration_minutes,
      cook_duration_minutes: form.cook_duration_minutes,
      servings: form.servings,
    })
    .select('id')
    .single()

  if (recipeError) throw recipeError

  await saveRecipeRelations(recipe.id, form)

  if (image?.file) {
    const imageUrl = await uploadRecipeImage(recipe.id, image.file)
    const { error } = await supabase
      .from('recipes')
      .update({ image_url: imageUrl })
      .eq('id', recipe.id)
    if (error) throw error
  }

  return recipe.id
}

export async function updateRecipe(
  id: string,
  form: RecipeFormData,
  image?: RecipeImageInput,
): Promise<void> {
  const updates: Record<string, unknown> = {
    name: form.name.trim(),
    source_link: form.source_link.trim() || null,
    prep_duration_minutes: form.prep_duration_minutes,
    cook_duration_minutes: form.cook_duration_minutes,
    servings: form.servings,
  }

  if (image?.remove && image.currentUrl) {
    await deleteRecipeImageByUrl(image.currentUrl)
    updates.image_url = null
  } else if (image?.file) {
    if (image.currentUrl) {
      await deleteRecipeImageByUrl(image.currentUrl)
    }
    updates.image_url = await uploadRecipeImage(id, image.file)
  }

  const { error: recipeError } = await supabase.from('recipes').update(updates).eq('id', id)
  if (recipeError) throw recipeError

  await supabase.from('recipe_ingredients').delete().eq('recipe_id', id)
  await supabase.from('recipe_instructions').delete().eq('recipe_id', id)
  await saveRecipeRelations(id, form)
}

export async function deleteRecipe(id: string): Promise<void> {
  const { data, error: fetchError } = await supabase
    .from('recipes')
    .select('image_url')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  if (data?.image_url) {
    await deleteRecipeImageByUrl(data.image_url)
  }

  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
}

async function saveRecipeRelations(recipeId: string, form: RecipeFormData): Promise<void> {
  const ingredientRows = []
  for (let i = 0; i < form.ingredients.length; i++) {
    const item = form.ingredients[i]
    if (!item.ingredient_name.trim()) continue

    const ingredient = await findOrCreateIngredient(
      item.ingredient_name,
      item.ingredient_category,
    )

    ingredientRows.push({
      recipe_id: recipeId,
      ingredient_id: ingredient.id,
      quantity_value: item.quantity_value,
      quantity_unit: item.quantity_unit,
      sort_order: i,
    })
  }

  if (ingredientRows.length > 0) {
    const { error } = await supabase.from('recipe_ingredients').insert(ingredientRows)
    if (error) throw error
  }

  const instructionRows = form.instructions
    .map((text, index) => ({ text: text.trim(), step: index + 1 }))
    .filter(({ text }) => text.length > 0)
    .map(({ text, step }) => ({
      recipe_id: recipeId,
      step_number: step,
      instruction_text: text,
    }))

  if (instructionRows.length > 0) {
    const { error } = await supabase.from('recipe_instructions').insert(instructionRows)
    if (error) throw error
  }
}

export function recipeToFormData(recipe: RecipeWithDetails): RecipeFormData {
  return {
    name: recipe.name,
    source_link: recipe.source_link ?? '',
    prep_duration_minutes: recipe.prep_duration_minutes,
    cook_duration_minutes: recipe.cook_duration_minutes,
    servings: recipe.servings,
    ingredients: recipe.recipe_ingredients.map((ri) => ({
      ingredient_name: ri.ingredient?.name ?? '',
      ingredient_category: ri.ingredient?.category ?? 'other',
      quantity_value: Number(ri.quantity_value),
      quantity_unit: ri.quantity_unit,
    })),
    instructions: recipe.recipe_instructions.map((i) => i.instruction_text),
  }
}
