'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AllocationPieChart } from '@/components/clarifi/investments-charts'

export function InvestmentsChartsSection(props: { pie: { name: string; value: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Alocação de ativos</CardTitle>
        <CardDescription>Distribuição atual com base no valor cadastrado em Contas</CardDescription>
      </CardHeader>
      <CardContent>
        <AllocationPieChart data={props.pie} />
      </CardContent>
    </Card>
  )
}
