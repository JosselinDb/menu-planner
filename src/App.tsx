import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RecipesPage } from './pages/RecipesPage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipeFormPage } from './pages/RecipeFormPage'
import { ShoppingListPage } from './pages/ShoppingListPage'
import { MenuPage } from './pages/MenuPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RecipesPage />} />
        <Route path="/recipes/new" element={<RecipeFormPage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="/recipes/:id/edit" element={<RecipeFormPage />} />
        <Route path="/shopping" element={<ShoppingListPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
