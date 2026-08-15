import { supabase } from '../supabase'

export const RECIPE_IMAGES_BUCKET = 'recipe-images'
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Please choose a JPEG, PNG, WebP, or GIF image.'
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Image must be 5 MB or smaller.'
  }
  return null
}

function extensionFor(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName
  }

  switch (file.type) {
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return 'jpg'
  }
}

export function getRecipeImagePath(recipeId: string, file: File): string {
  return `${recipeId}/cover.${extensionFor(file)}`
}

export function getStoragePathFromUrl(imageUrl: string): string | null {
  const marker = `/storage/v1/object/public/${RECIPE_IMAGES_BUCKET}/`
  const index = imageUrl.indexOf(marker)
  if (index === -1) return null
  return decodeURIComponent(imageUrl.slice(index + marker.length))
}

export async function uploadRecipeImage(recipeId: string, file: File): Promise<string> {
  const validationError = validateImageFile(file)
  if (validationError) throw new Error(validationError)

  const path = getRecipeImagePath(recipeId, file)
  const { error } = await supabase.storage.from(RECIPE_IMAGES_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  })

  if (error) throw error

  const { data } = supabase.storage.from(RECIPE_IMAGES_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteRecipeImageByUrl(imageUrl: string): Promise<void> {
  const path = getStoragePathFromUrl(imageUrl)
  if (!path) return

  const { error } = await supabase.storage.from(RECIPE_IMAGES_BUCKET).remove([path])
  if (error) throw error
}
