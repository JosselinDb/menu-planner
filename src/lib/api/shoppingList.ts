import { supabase } from '../supabase'
import type { IngredientCategory, ShoppingListItem } from '../types'
import { findOrCreateIngredient } from './ingredients'

const selectWithIngredient = '*, ingredient:ingredients (*)'

export async function fetchShoppingList(): Promise<ShoppingListItem[]> {
  const { data, error } = await supabase
    .from('shopping_list_items')
    .select(selectWithIngredient)
    .order('checked')
    .order('created_at')

  if (error) throw error
  return (data ?? []) as ShoppingListItem[]
}

export async function addShoppingItem(
  name: string,
  category: IngredientCategory,
  quantityValue: number,
  quantityUnit: string,
): Promise<void> {
  const ingredient = await findOrCreateIngredient(name, category)

  const { data: existing } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('ingredient_id', ingredient.id)
    .eq('quantity_unit', quantityUnit)
    .eq('checked', false)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('shopping_list_items')
      .update({
        quantity_value: Number(existing.quantity_value) + quantityValue,
      })
      .eq('id', existing.id)
    if (error) throw error
    return
  }

  const { error } = await supabase.from('shopping_list_items').insert({
    ingredient_id: ingredient.id,
    quantity_value: quantityValue,
    quantity_unit: quantityUnit,
  })

  if (error) throw error
}

export async function updateShoppingItem(
  id: string,
  updates: Partial<Pick<ShoppingListItem, 'quantity_value' | 'quantity_unit' | 'checked'>>,
): Promise<void> {
  const { error } = await supabase.from('shopping_list_items').update(updates).eq('id', id)
  if (error) throw error
}

export async function removeShoppingItem(id: string): Promise<void> {
  const { error } = await supabase.from('shopping_list_items').delete().eq('id', id)
  if (error) throw error
}

export async function clearCheckedItems(): Promise<void> {
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('checked', true)

  if (error) throw error
}

export async function addMenuIngredientsToShoppingList(
  items: { name: string; category: IngredientCategory; quantity_value: number; quantity_unit: string }[],
): Promise<void> {
  for (const item of items) {
    await addShoppingItem(item.name, item.category, item.quantity_value, item.quantity_unit)
  }
}
