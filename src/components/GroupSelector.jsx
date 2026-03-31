import React, { useState } from 'react'
import { Plus, Users, ChevronRight } from 'lucide-react'
import Avatar from './Avatar'

export default function GroupSelector({ groups, activeGroupId, onSelect, onCreateGroup, people }) {
  const [creating, setCreating] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState([])

  function handleCreate(e) {
    e.preventDefault()
    if (!groupName.trim() || selectedMembers.length < 2) return
    onCreateGroup(groupName.trim(), selectedMembers)
    setGroupName('')
    setSelectedMembers([])
    setCreating(false)
  }

  function toggleMember(id) {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  function getMemberNames(memberIds) {
    return memberIds
      .map((id) => people.find((p) => p.id === id)?.name)
      .filter(Boolean)
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {/* "All expenses" card */}
      <button
        onClick={() => onSelect(null)}
        className={`sw-card w-full p-4 flex items-center gap-3 text-left transition-all duration-200 ${
          !activeGroupId ? 'ring-2 ring-sw-teal ring-offset-1' : ''
        }`}
      >
        <div className="w-10 h-10 rounded-xl bg-sw-teal/10 flex items-center justify-center shrink-0">
          <Users size={20} className="text-sw-teal" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-sw-dark">All Expenses</p>
          <p className="text-xs text-sw-gray mt-0.5">Everyone's expenses combined</p>
        </div>
        <ChevronRight size={16} className="text-sw-gray-lt shrink-0" />
      </button>

      {/* Group cards */}
      {groups.map((group) => {
        const memberNames = getMemberNames(group.memberIds)
        const isActive = activeGroupId === group.id

        return (
          <button
            key={group.id}
            onClick={() => onSelect(group.id)}
            className={`sw-card w-full p-4 flex items-center gap-3 text-left transition-all duration-200 ${
              isActive ? 'ring-2 ring-sw-teal ring-offset-1' : ''
            }`}
          >
            {/* Stacked avatars */}
            <div className="flex -space-x-2 shrink-0">
              {memberNames.slice(0, 3).map((name) => (
                <Avatar key={name} name={name} size="sm" className="ring-2 ring-white" />
              ))}
              {memberNames.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 text-sw-gray text-xs font-bold flex items-center justify-center ring-2 ring-white">
                  +{memberNames.length - 3}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sw-dark truncate">{group.name}</p>
              <p className="text-xs text-sw-gray mt-0.5 truncate">
                {memberNames.join(', ')}
              </p>
            </div>
            <ChevronRight size={16} className="text-sw-gray-lt shrink-0" />
          </button>
        )
      })}

      {/* Create group */}
      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="sw-card w-full p-4 flex items-center gap-3 text-left border-2 border-dashed border-sw-divider hover:border-sw-teal/40 transition-all duration-200 bg-transparent shadow-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Plus size={20} className="text-sw-gray" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-sw-gray">Create New Group</p>
            <p className="text-xs text-sw-gray-lt mt-0.5">Organize expenses by trip, house, etc.</p>
          </div>
        </button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="sw-card p-5 space-y-4 animate-scale-in"
        >
          <h3 className="text-sm font-bold text-sw-dark">New Group</h3>

          <input
            type="text"
            placeholder="Group name (e.g. Road Trip, Roommates)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            autoFocus
            className="sw-input"
          />

          <div>
            <p className="text-xs font-semibold text-sw-gray uppercase tracking-wider mb-2">
              Members (at least 2)
            </p>
            <div className="flex flex-wrap gap-2">
              {people.map((p) => {
                const isSelected = selectedMembers.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleMember(p.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                      isSelected
                        ? 'border-sw-teal bg-sw-teal/10 text-sw-teal'
                        : 'border-sw-divider bg-white text-sw-gray hover:border-sw-teal/40'
                    }`}
                  >
                    <Avatar name={p.name} size="xs" />
                    {p.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={!groupName.trim() || selectedMembers.length < 2}
              className="sw-btn-primary flex-1"
            >
              Create Group
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false)
                setGroupName('')
                setSelectedMembers([])
              }}
              className="sw-btn-ghost"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
