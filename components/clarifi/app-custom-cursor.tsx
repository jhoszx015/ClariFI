'use client'

import { usePathname } from 'next/navigation'

import { CustomCursor } from '@/components/clarifi/custom-cursor'

export function AppCustomCursor() {
  const pathname = usePathname()
  const isLanding = pathname === '/'

  return <CustomCursor idleEffectsEnabled={isLanding} />
}
