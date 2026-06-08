export interface Category {
  id: string
  name: string
  shelf_number: string
  description: string | null
  color: string | null
  created_at: string
}

export type CategoryInsert = Omit<Category, 'id' | 'created_at'>
export type CategoryUpdate = Partial<CategoryInsert>
