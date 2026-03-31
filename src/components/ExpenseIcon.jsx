import React from 'react'
import {
  Receipt, Utensils, ShoppingCart, Home, Car, Plane,
  Wifi, Zap, Gamepad2, Music, Film, Heart,
  GraduationCap, Beer, Coffee, Gift, Scissors,
} from 'lucide-react'

const CATEGORY_MAP = [
  { keywords: ['dinner', 'lunch', 'breakfast', 'food', 'meal', 'restaurant', 'pizza', 'burger', 'sushi', 'taco', 'bbq'], icon: Utensils, bg: 'bg-orange-100', color: 'text-orange-500' },
  { keywords: ['grocery', 'groceries', 'supermarket', 'market', 'walmart', 'costco', 'trader'], icon: ShoppingCart, bg: 'bg-green-100', color: 'text-green-600' },
  { keywords: ['rent', 'house', 'apartment', 'housing', 'mortgage', 'lease'], icon: Home, bg: 'bg-blue-100', color: 'text-blue-500' },
  { keywords: ['gas', 'fuel', 'car', 'uber', 'lyft', 'taxi', 'parking', 'toll', 'auto'], icon: Car, bg: 'bg-purple-100', color: 'text-purple-500' },
  { keywords: ['flight', 'plane', 'airbnb', 'hotel', 'travel', 'trip', 'vacation', 'booking'], icon: Plane, bg: 'bg-sky-100', color: 'text-sky-500' },
  { keywords: ['internet', 'wifi', 'cable', 'phone', 'mobile', 'data'], icon: Wifi, bg: 'bg-indigo-100', color: 'text-indigo-500' },
  { keywords: ['electric', 'electricity', 'utility', 'utilities', 'water', 'power', 'bill'], icon: Zap, bg: 'bg-yellow-100', color: 'text-yellow-600' },
  { keywords: ['game', 'gaming', 'xbox', 'playstation', 'nintendo', 'steam'], icon: Gamepad2, bg: 'bg-rose-100', color: 'text-rose-500' },
  { keywords: ['spotify', 'music', 'concert', 'festival', 'ticket'], icon: Music, bg: 'bg-pink-100', color: 'text-pink-500' },
  { keywords: ['netflix', 'movie', 'cinema', 'hulu', 'disney', 'streaming', 'show'], icon: Film, bg: 'bg-red-100', color: 'text-red-500' },
  { keywords: ['doctor', 'hospital', 'medical', 'health', 'pharmacy', 'medicine'], icon: Heart, bg: 'bg-rose-100', color: 'text-rose-600' },
  { keywords: ['school', 'tuition', 'book', 'class', 'course', 'education'], icon: GraduationCap, bg: 'bg-amber-100', color: 'text-amber-600' },
  { keywords: ['bar', 'drink', 'beer', 'wine', 'alcohol', 'pub', 'club'], icon: Beer, bg: 'bg-amber-100', color: 'text-amber-500' },
  { keywords: ['coffee', 'cafe', 'starbucks', 'tea', 'latte'], icon: Coffee, bg: 'bg-orange-100', color: 'text-orange-700' },
  { keywords: ['gift', 'present', 'birthday', 'wedding'], icon: Gift, bg: 'bg-pink-100', color: 'text-pink-600' },
  { keywords: ['haircut', 'salon', 'barber', 'spa', 'beauty'], icon: Scissors, bg: 'bg-violet-100', color: 'text-violet-500' },
]

function matchCategory(expenseName) {
  const lower = expenseName.toLowerCase()
  for (const cat of CATEGORY_MAP) {
    if (cat.keywords.some((kw) => lower.includes(kw))) return cat
  }
  return null
}

export default function ExpenseIcon({ name, size = 20 }) {
  const cat = matchCategory(name)
  const Icon = cat?.icon ?? Receipt
  const bg = cat?.bg ?? 'bg-gray-100'
  const color = cat?.color ?? 'text-sw-gray'

  return (
    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
      <Icon size={size} className={color} />
    </div>
  )
}
