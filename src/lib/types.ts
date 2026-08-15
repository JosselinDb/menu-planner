export const INGREDIENT_CATEGORIES = [
  'produce',
  'dairy',
  'meat',
  'fish',
  'pantry',
  'spices',
  'frozen',
  'other',
] as const

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number]

export const QUANTITY_UNITS = [
  'g',
  'kg',
  'ml',
  'L',
  'tbsp',
  'tsp',
  'cup',
  'piece',
  'pinch',
  'clove',
  'slice',
  'can',
  'pack',
] as const

export type QuantityUnit = (typeof QUANTITY_UNITS)[number]

export interface Ingredient {
  id: string
  name: string
  category: IngredientCategory
  created_at: string
}

export interface Recipe {
  id: string
  name: string
  source_link: string | null
  prep_duration_minutes: number
  cook_duration_minutes: number
  servings: number
  created_at: string
  updated_at: string
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  ingredient_id: string
  quantity_value: number
  quantity_unit: string
  sort_order: number
  ingredient?: Ingredient
}

export interface RecipeInstruction {
  id: string
  recipe_id: string
  step_number: number
  instruction_text: string
}

export interface RecipeWithDetails extends Recipe {
  recipe_ingredients: RecipeIngredient[]
  recipe_instructions: RecipeInstruction[]
}

export interface ShoppingListItem {
  id: string
  ingredient_id: string
  quantity_value: number
  quantity_unit: string
  checked: boolean
  created_at: string
  ingredient?: Ingredient
}

export interface MenuItem {
  id: string
  recipe_id: string
  sort_order: number
  menu_date: string | null
  created_at: string
  recipe?: Recipe
}

export interface RecipeIngredientInput {
  ingredient_name: string
  ingredient_category: IngredientCategory
  quantity_value: number
  quantity_unit: string
}

export interface RecipeFormData {
  name: string
  source_link: string
  prep_duration_minutes: number
  cook_duration_minutes: number
  servings: number
  ingredients: RecipeIngredientInput[]
  instructions: string[]
}

export function scaleQuantity(value: number, fromServings: number, toServings: number): number {
  if (fromServings <= 0) return value
  const scaled = (value * toServings) / fromServings
  return Math.round(scaled * 100) / 100
}

export function formatDuration(prepMinutes: number, cookMinutes: number): string {
  const total = prepMinutes + cookMinutes
  if (total === 0) return '—'
  const parts: string[] = []
  if (prepMinutes > 0) parts.push(`${prepMinutes} min prep`)
  if (cookMinutes > 0) parts.push(`${cookMinutes} min cook`)
  return parts.join(' · ')
}

export function formatQuantity(value: number, unit: string): string {
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '')
  return unit ? `${formatted} ${unit}` : formatted
}
