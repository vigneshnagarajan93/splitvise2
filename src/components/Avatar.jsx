import React from 'react'

// Deterministic color from name string → hue
const AVATAR_COLORS = [
  '#1CC29F', '#FF652F', '#3498DB', '#9B59B6',
  '#E74C3C', '#F39C12', '#2ECC71', '#E67E22',
  '#1ABC9C', '#E84393', '#6C5CE7', '#00B894',
]

function hashName(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

export default function Avatar({ name, size = 'md', className = '' }) {
  const color = AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length]
  const initials = getInitials(name)
  const sizeClass = SIZES[size] ?? SIZES.md

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none ${className}`}
      style={{ backgroundColor: color }}
      title={name}
      aria-label={name}
    >
      {initials}
    </div>
  )
}
