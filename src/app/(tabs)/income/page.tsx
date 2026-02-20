import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { listPayslips } from '@/lib/income/queries'
import { PayslipList } from './components/payslip-list'
import { IncomeChart } from './components/income-chart'

export default async function IncomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let payslips: Awaited<ReturnType<typeof listPayslips>> = []
  try {
    payslips = await listPayslips(supabase, user.id)
  } catch {
    payslips = []
  }

  return (
    <div>
      <IncomeChart payslips={payslips} />
      <PayslipList initialPayslips={payslips} userId={user.id} />
    </div>
  )
}
