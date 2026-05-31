import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function DashboardPanelBack() {
  return (
    <Button variant="ghost" size="sm" className="w-fit gap-1 px-0 text-muted-foreground" asChild>
      <Link href="/dashboard">
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </Link>
    </Button>
  )
}
