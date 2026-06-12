'use client'

import * as React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { User } from '@/types'
import { cn } from '@/lib/utils'

export function displayNameInitials(name?: string | null) {
  if (!name?.trim()) return 'U'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

type UserAvatarProps = {
  user: Pick<User, 'name' | 'avatar'> | null | undefined
  className?: string
  /** Classes para o contêiner radial (radix root). */
  fallbackClassName?: string
}

export function UserAvatar({ user, className, fallbackClassName }: UserAvatarProps) {
  const initials = React.useMemo(() => displayNameInitials(user?.name), [user?.name])
  const src = user?.avatar?.trim()

  return (
    <Avatar className={className}>
      {src ? <AvatarImage alt="" src={src} decoding="async" /> : null}
      <AvatarFallback className={cn('bg-muted', fallbackClassName)}>{initials}</AvatarFallback>
    </Avatar>
  )
}
