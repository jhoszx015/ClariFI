'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useAiAssistant } from '@/components/clarifi/ai-assistant-context'
import { Spinner } from '@/components/ui/spinner'

/** Rota legada — abre o widget flutuante e volta ao painel. */
export default function AssistenteIaPage() {
  const router = useRouter()
  const { setOpen } = useAiAssistant()

  useEffect(() => {
    setOpen(true)
    router.replace('/dashboard')
  }, [router, setOpen])

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="size-8 text-primary" />
    </div>
  )
}
