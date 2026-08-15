import { supabase } from '../supabase'
import type { MenuItem, RecipeWithDetails } from '../types'
import { fetchRecipe } from './recipes'

const selectWithRecipe = '*, recipe:recipes (*)'

export async function fetchMenu(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select(selectWithRecipe)
    .order('sort_order')

  if (error) throw error
  return (data ?? []) as MenuItem[]
}

export async function generateMenu(count: number): Promise<void> {
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id')

  if (recipesError) throw recipesError
  if (!recipes?.length) throw new Error('Add some recipes before generating a menu.')

  await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const shuffled = [...recipes].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, Math.min(count, shuffled.length))

  const today = new Date()
  const rows = selected.map((recipe, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)
    return {
      recipe_id: recipe.id,
      sort_order: index,
      menu_date: date.toISOString().slice(0, 10),
    }
  })

  const { error } = await supabase.from('menu_items').insert(rows)
  if (error) throw error
}

export async function replaceMenuSlot(menuItemId: string): Promise<void> {
  const { data: menuItem, error: fetchError } = await supabase
    .from('menu_items')
    .select('id, recipe_id')
    .eq('id', menuItemId)
    .single()

  if (fetchError) throw fetchError

  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id')

  if (recipesError) throw recipesError
  if (!recipes?.length) throw new Error('No recipes available.')

  const alternatives = recipes.filter((r) => r.id !== menuItem.recipe_id)
  const pool = alternatives.length > 0 ? alternatives : recipes
  const pick = pool[Math.floor(Math.random() * pool.length)]

  const { error } = await supabase
    .from('menu_items')
    .update({ recipe_id: pick.id })
    .eq('id', menuItemId)

  if (error) throw error
}

export async function removeMenuItem(id: string): Promise<void> {
  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  if (error) throw error
}

export async function fetchMenuRecipesWithDetails(): Promise<RecipeWithDetails[]> {
  const menu = await fetchMenu()
  const recipes: RecipeWithDetails[] = []

  for (const item of menu) {
    if (item.recipe_id) {
      recipes.push(await fetchRecipe(item.recipe_id))
    }
  }

  return recipes
}

export async function clearMenu(): Promise<void> {
  const { error } = await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw error
}
