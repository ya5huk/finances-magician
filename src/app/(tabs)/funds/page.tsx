'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FundType, FundEntry, Deposit, Loan } from '@/lib/types/database'
import { DEFAULT_CURRENCY, type Currency } from '@/lib/constants'
import { listFundTypes, listFundEntries, listDeposits, listLoans } from '@/lib/funds/queries'
import { FundList } from './components/fund-list'
import { DepositList } from './components/deposit-list'
import { LoanList } from './components/loan-list'
import { NetPosition } from './components/net-position'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function FundsPage() {
  const [fundTypes, setFundTypes] = useState<FundType[]>([])
  const [entries, setEntries] = useState<FundEntry[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'funds' | 'deposits' | 'loans'>('funds')

  const loadData = useCallback(async () => {
    try {
      const [ft, fe, d, l] = await Promise.all([
        listFundTypes(),
        listFundEntries(),
        listDeposits(),
        listLoans(),
      ])
      setFundTypes(ft)
      setEntries(fe)
      setDeposits(d)
      setLoans(l)
    } catch (err) {
      console.error('Failed to load funds data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funds & Deposits</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Pension, education funds, deposits & loans
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  const tabs = [
    { key: 'funds' as const, label: 'Funds', count: fundTypes.length },
    { key: 'deposits' as const, label: 'Deposits', count: deposits.length },
    { key: 'loans' as const, label: 'Loans', count: loans.length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funds & Deposits</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Pension, education funds, deposits & loans
          </p>
        </div>
        <Link href="/funds/settings">
          <Button variant="secondary" size="sm">
            Fund Settings
          </Button>
        </Link>
      </div>

      {/* Net Position Summary */}
      <NetPosition
        entries={entries}
        deposits={deposits}
        loans={loans}
        baseCurrency={DEFAULT_CURRENCY}
      />

      {/* Tab Selector */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer
              ${activeTab === tab.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'funds' && (
        <FundList
          fundTypes={fundTypes}
          entries={entries}
          onEntryCreated={loadData}
        />
      )}

      {activeTab === 'deposits' && (
        <DepositList
          deposits={deposits}
          fundTypes={fundTypes}
          onDataChanged={loadData}
        />
      )}

      {activeTab === 'loans' && (
        <LoanList
          loans={loans}
          onDataChanged={loadData}
        />
      )}
    </div>
  )
}
