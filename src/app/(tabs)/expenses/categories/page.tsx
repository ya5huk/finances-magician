import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { listExpenseCategories } from '@/lib/expenses/queries'
import { CategoryManager } from '../components/category-manager'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let categories: Awaited<ReturnType<typeof listExpenseCategories>> = []
  try {
    categories = await listExpenseCategories(supabase, user.id)
  } catch {
    categories = []
  }

  return <CategoryManager initialCategories={categories} userId={user.id} />
}
