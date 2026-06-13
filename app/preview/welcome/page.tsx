'use client'

import { WelcomeSplash } from '@/components/clarifi/welcome-splash'

/** Prévia local da animação pós-cadastro — recarrega ao terminar para repetir. */
export default function WelcomePreviewPage() {
  return (
    <WelcomeSplash
      userName="Douglas"
      onComplete={() => {
        window.setTimeout(() => window.location.reload(), 400)
      }}
    />
  )
}
