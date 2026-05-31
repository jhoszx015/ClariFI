'use client'

import Link from 'next/link'
import { LineChart, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InvestmentEvolutionChart } from '@/components/clarifi/investment-evolution-chart'
import type { InvestmentChartRange } from '@/lib/data/investment-evolution-mock'
import type { InvestmentEvolutionPoint } from '@/lib/data/investment-evolution-mock'

type InvestmentEvolutionSectionProps = {
  series: InvestmentEvolutionPoint[]
  range: InvestmentChartRange
  onRangeChange: (range: InvestmentChartRange) => void
  isSimulated: boolean
}

export function InvestmentEvolutionSection({
  series,
  range,
  onRangeChange,
  isSimulated,
}: InvestmentEvolutionSectionProps) {
  return (
    <Card className="border-border/80 overflow-hidden">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LineChart className="h-5 w-5 text-primary" />
            Evolução dos investimentos
          </CardTitle>
          <CardDescription>
            Valor total da carteira ao longo do tempo, com comparação ao benchmark CDI+.
            {isSimulated ? ' Histórico ilustrativo com base no valor cadastrado em Contas.' : ''}
          </CardDescription>
        </div>
        <Tabs value={range} onValueChange={(v) => onRangeChange(v as InvestmentChartRange)}>
          <TabsList className="grid w-full grid-cols-3 sm:w-[240px]">
            <TabsTrigger value="6m">6 meses</TabsTrigger>
            <TabsTrigger value="12m">12 meses</TabsTrigger>
            <TabsTrigger value="24m">24 meses</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <InvestmentEvolutionChart series={series} />
      </CardContent>
    </Card>
  )
}

export function InvestmentEvolutionEmptyState() {
  return (
    <Card className="border-dashed border-border/80">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <LineChart className="h-7 w-7 text-muted-foreground" />
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Nenhum investimento cadastrado ainda</h3>
          <p className="text-sm text-muted-foreground">
            Adicione seu primeiro investimento para acompanhar sua evolução ao longo do tempo.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/contas">
            <Plus className="h-4 w-4" />
            Adicionar investimento
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}