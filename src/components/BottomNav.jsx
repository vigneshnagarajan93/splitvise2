import React from 'react'
import { LayoutDashboard, Users, Activity, User, Plus } from 'lucide-react'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'groups',    label: 'Groups',    icon: Users },
  { id: 'add',      label: '',           icon: Plus },
  { id: 'activity',  label: 'Activity',  icon: Activity },
  { id: 'account',   label: 'Account',   icon: User },
]

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glow / blur backdrop */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-lg shadow-nav" />

      <div
        className="relative max-w-2xl mx-auto flex items-end justify-around px-2"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        {TABS.map((tab) => {
          if (tab.id === 'add') {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange('add')}
                className="sw-fab -mt-5 relative z-10"
                aria-label="Add expense"
                id="btn-add-expense"
              >
                <Plus size={28} strokeWidth={2.5} />
              </button>
            )
          }

          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] transition-colors duration-200 ${
                isActive ? 'text-sw-teal' : 'text-sw-gray-lt hover:text-sw-gray'
              }`}
              aria-label={tab.label}
              id={`tab-${tab.id}`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-sw-teal' : 'text-sw-gray-lt'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
