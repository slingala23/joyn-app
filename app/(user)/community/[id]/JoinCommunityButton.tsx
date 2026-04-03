'use client'

import { useTransition } from 'react'
import { joinCommunity, leaveCommunity } from '@/app/actions/community'

interface Props {
  communityId: string
  isMember: boolean
  isAuthed: boolean
}

export default function JoinCommunityButton({ communityId, isMember, isAuthed }: Props) {
  const [isPending, startTransition] = useTransition()

  if (!isAuthed) {
    return (
      <a
        href="/login"
        className="w-full block text-center bg-coral text-white font-bold py-3 rounded-btn text-sm active:opacity-80 transition-opacity"
      >
        Sign in to join
      </a>
    )
  }

  function handleClick() {
    startTransition(async () => {
      if (isMember) {
        await leaveCommunity(communityId)
      } else {
        await joinCommunity(communityId)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`w-full font-bold py-3 rounded-btn text-sm transition-opacity active:opacity-80 disabled:opacity-50 ${
        isMember
          ? 'border-2 border-ink/20 text-ink/70 bg-transparent'
          : 'bg-coral text-white'
      }`}
    >
      {isPending ? (isMember ? 'Leaving…' : 'Joining…') : isMember ? 'Leave community' : 'Join community'}
    </button>
  )
}
