import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { listExpenses, listExpenseCategories } from '@/lib/expenses/queries'
import { ExpenseList } from './components/expense-list'
import { ExpenseChart } from './components/expense-chart'

export default async function ExpensesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let expenses: Awaited<ReturnType<typeof listExpenses>> = []
  let categories: Awaited<ReturnType<typeof listExpenseCategories>> = []
  try {
    ;[expenses, categories] = await Promise.all([
      listExpenses(supabase, user.id),
      listExpenseCategories(supabase, user.id),
    ])
  } catch {
    expenses = []
    categories = []
  }

  return (
    <div>
      {/* Categories Link */}
      <div className="flex justify-end mb-2">
        <Link
          href="/expenses/categories"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Manage Categories
        </Link>
      </div>

      <ExpenseChart expenses={expenses} categories={categories} />
      <ExpenseList initialExpenses={expenses} categories={categories} userId={user.id} />
    </div>
  )
}
