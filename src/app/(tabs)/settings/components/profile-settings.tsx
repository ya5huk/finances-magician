'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSupabase } from '@/providers/supabase-provider'
import { CURRENCIES, CURRENCY_SYMBOLS, type Currency } from '@/lib/constants'
import { Card, CardHeader } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export function ProfileSettings() {
  const { user } = useSupabase()
  const supabase = createClient()

  const [baseCurrency, setBaseCurrency] = useState<Currency>('ILS')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Fetch profile on mount
  useEffect(() => {
    if (!user) return

    async function loadProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('base_currency')
        .eq('id', user!.id)
        .single()

      if (data?.base_currency) {
        setBaseCurrency(data.base_currency as Currency)
      }
      setLoading(false)
    }

    loadProfile()
  }, [user, supabase])

  async function handleSave() {
    if (!user) return

    setSaving(true)
    setSaved(false)

    const { error } = await supabase
      .from('profiles')
      .update({
        base_currency: baseCurrency,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    setSaving(false)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const currencyOptions = CURRENCIES.map((c) => ({
    value: c,
    label: `${CURRENCY_SYMBOLS[c]} ${c}`,
  }))

  return (
    <Card padding="lg">
      <CardHeader
        title="Profile"
        subtitle="Your account details and preferences"
      />

      <div className="mt-6 space-y-5">
        {/* Email (read-only) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Email</label>
          <div className="h-10 px-3 flex items-center bg-muted text-muted-foreground text-sm rounded-lg border border-border">
            {user?.email ?? 'Loading...'}
          </div>
        </div>

        {/* Base currency selector */}
        {loading ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Base Currency</label>
            <div className="h-10 px-3 flex items-center bg-muted text-muted-foreground text-sm rounded-lg border border-border animate-pulse">
              Loading...
            </div>
          </div>
        ) : (
          <Select
            label="Base Currency"
            options={currencyOptions}
            value={baseCurrency}
            onChange={(val) => setBaseCurrency(val as Currency)}
          />
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={loading}
            size="sm"
          >
            Save Changes
          </Button>
          {saved && (
            <span className="text-sm text-accent">Saved successfully</span>
          )}
        </div>
      </div>
    </Card>
  )
}
