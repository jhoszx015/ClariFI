'use client'

import { AiAssistantChat } from '@/components/clarifi/ai-assistant-chat'
import { DashboardPanelBack } from '@/components/clarifi/dashboard-panel-back'

export default function AssistenteIaPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <DashboardPanelBack />
      <AiAssistantChat variant="page" className="min-h-[min(72vh,640px)]" />
    </div>
  )
}
