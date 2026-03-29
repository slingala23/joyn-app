'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const CATEGORIES = ['All', 'Sports', 'Arts', 'Music', 'Food', 'Outdoors', 'Social', 'Wellness']

export default function CategoryFilter({ selected }: { selected: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setCategory = useCallback(
    (cat: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (cat === 'All') {
        params.delete('category')
      } else {
        params.set('category', cat)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
      {CATEGORIES.map((cat) => {
        const active = cat === selected || (cat === 'All' && !selected)
        return (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-btn text-sm font-bold transition-colors ${
              active
                ? 'bg-coral text-white'
                : 'bg-ink/6 text-ink/60 hover:bg-ink/10'
            }`}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
