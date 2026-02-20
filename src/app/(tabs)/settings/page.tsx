'use client'

import { ProfileSettings } from './components/profile-settings'
import { FundTypeSettings } from './components/fund-type-settings'
import { CategorySettings } from './components/category-settings'

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <p className="mt-2 text-muted-foreground">
        Manage fund types, categories &amp; preferences
      </p>

      <div className="mt-8 space-y-6">
        <ProfileSettings />
        <FundTypeSettings />
        <CategorySettings />
      </div>
    </div>
  )
}
