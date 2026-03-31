import React, { useState } from 'react'
import { X, Trash2, Edit2, Check, Plus, Users, ChevronRight, UserCheck } from 'lucide-react'
import Avatar from './Avatar'

function PeopleTab({ people, onUpdate, currentUser, onSetCurrentUser }) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  function addPerson() {
    const trimmed = newName.trim()
    if (!trimmed) return
    if (people.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) return
    onUpdate([...people, { id: Date.now().toString(), name: trimmed }])
    setNewName('')
  }

  function deletePerson(id) {
    if (people.length <= 2) return
    onUpdate(people.filter((p) => p.id !== id))
  }

  function startEdit(person) {
    setEditingId(person.id)
    setEditName(person.name)
  }

  function confirmEdit(id) {
    const trimmed = editName.trim()
    if (!trimmed) return
    onUpdate(people.map((p) => (p.id === id ? { ...p, name: trimmed } : p)))
    setEditingId(null)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-sw-gray">
        People appear in all expense forms. At least 2 required.
      </p>

      <ul className="space-y-1">
        {people.map((person) => (
          <li
            key={person.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            {editingId === person.id ? (
              <>
                <Avatar name={editName || person.name} size="sm" />
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmEdit(person.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="flex-1 border border-sw-teal rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sw-teal/30"
                />
                <button
                  onClick={() => confirmEdit(person.id)}
                  className="p-2 text-sw-teal hover:bg-sw-teal/10 rounded-lg transition-colors"
                >
                  <Check size={16} />
                </button>
              </>
            ) : (
              <>
                <Avatar name={person.name} size="sm" />
                <span className="flex-1 text-sm font-medium text-sw-dark">{person.name}
                  {currentUser === person.name && (
                    <span className="ml-2 text-[10px] font-bold text-sw-teal bg-sw-teal/10 px-1.5 py-0.5 rounded-full uppercase">You</span>
                  )}
                </span>
                <button
                  onClick={() => onSetCurrentUser?.(currentUser === person.name ? null : person.name)}
                  title={currentUser === person.name ? 'Unset as me' : 'Set as me'}
                  className={`p-2 rounded-lg transition-all ${
                    currentUser === person.name
                      ? 'text-sw-teal bg-sw-teal/10'
                      : 'text-sw-gray-lt hover:text-sw-teal hover:bg-sw-teal/5'
                  }`}
                >
                  <UserCheck size={15} />
                </button>
                <button
                  onClick={() => startEdit(person)}
                  className="p-2 text-sw-gray-lt hover:text-sw-teal rounded-lg hover:bg-sw-teal/5 transition-all"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => deletePerson(person.id)}
                  disabled={people.length <= 2}
                  className="p-2 text-sw-gray-lt hover:text-sw-red rounded-lg hover:bg-sw-red-lt disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="flex gap-2 pt-1">
        <input
          type="text"
          placeholder="Add a person…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addPerson()
            }
          }}
          className="sw-input flex-1"
        />
        <button
          onClick={addPerson}
          disabled={!newName.trim()}
          className="w-11 h-11 rounded-xl bg-sw-teal text-white flex items-center justify-center hover:bg-sw-teal-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  )
}

function GroupsTab({ groups, people, onUpdate }) {
  function deleteGroup(id) {
    onUpdate(groups.filter((g) => g.id !== id))
  }

  function getMemberNames(memberIds) {
    return memberIds
      .map((id) => people.find((p) => p.id === id)?.name)
      .filter(Boolean)
  }

  return (
    <div className="space-y-3">
      {groups.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Users size={22} className="text-sw-gray-lt" />
          </div>
          <p className="text-sm text-sw-gray font-medium">No groups yet</p>
          <p className="text-xs text-sw-gray-lt mt-1">Create groups from the Groups tab.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {groups.map((group) => {
            const memberNames = getMemberNames(group.memberIds)
            return (
              <li key={group.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 group hover:bg-gray-100/80 transition-colors">
                <div className="flex -space-x-1.5 shrink-0">
                  {memberNames.slice(0, 3).map((n) => (
                    <Avatar key={n} name={n} size="xs" className="ring-2 ring-white" />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-sw-dark truncate">{group.name}</p>
                  <p className="text-xs text-sw-gray mt-0.5 truncate">
                    {memberNames.join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => deleteGroup(group.id)}
                  className="p-2 text-sw-gray-lt hover:text-sw-red rounded-lg hover:bg-sw-red-lt transition-all shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function SettingsModal({ people, groups, onUpdatePeople, onUpdateGroups, onClose, currentUser, onSetCurrentUser }) {
  const [tab, setTab] = useState('people')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="sw-backdrop" onClick={onClose} />

      <div className="relative z-50 bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-modal max-h-[80vh] flex flex-col animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sw-divider">
          <h2 className="text-lg font-bold text-sw-dark">Account</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-sw-gray transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-sw-divider">
          {[
            { id: 'people', label: 'People' },
            { id: 'groups', label: 'Groups' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-sm font-semibold capitalize transition-all duration-200 relative ${
                tab === t.id
                  ? 'text-sw-teal'
                  : 'text-sw-gray-lt hover:text-sw-gray'
              }`}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-sw-teal rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'people' ? (
            <PeopleTab people={people} onUpdate={onUpdatePeople} currentUser={currentUser} onSetCurrentUser={onSetCurrentUser} />
          ) : (
            <GroupsTab groups={groups} people={people} onUpdate={onUpdateGroups} />
          )}
        </div>
      </div>
    </div>
  )
}
