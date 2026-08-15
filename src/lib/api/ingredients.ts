import { supabase } from '../supabase'
import type { Ingredient, IngredientCategory } from '../types'

export async function findOrCreateIngredient(
  name: string,
  category: IngredientCategory,
): Promise<Ingredient> {
  const trimmed = name.trim()
  const { data: existing } = await supabase
    .from('ingredients')
    .select('*')
    .ilike('name', trimmed)
    .maybeSingle()

  if (existing) return existing as Ingredient

  const { data, error } = await supabase
    .from('ingredients')
    .insert({ name: trimmed, category })
    .select()
    .single()

  if (error) throw error
  return data as Ingredient
}

export async function fetchIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name')

  if (error) throw error
  return (data ?? []) as Ingredient[]
}

export async function searchIngredients(query: string): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(20)

  if (error) throw error
  return (data ?? []) as Ingredient[]
}
