'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { parseMoneyBr } from '@/lib/utils'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

/**
 * Juro composto com capitalização mensal, valor inicial, aporte mensal recorrente
 * e taxa anual nominal (convenção comum em simuladores de CDB / Tesouro).
 */
export function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState('10000')
  const [monthlyContrib, setMonthlyContrib] = useState('0')
  const [rateAnnualPct, setRateAnnualPct] = useState('12')
  const [period, setPeriod] = useState('5')
  const [unit, setUnit] = useState<'years' | 'months'>('years')

  const result = useMemo(() => {
    const pv = parseMoneyBr(principal)
    const pmt = parseMoneyBr(monthlyContrib)
    const annual = parseFloat(rateAnnualPct.replace(',', '.')) / 100
    const p = parseFloat(period.replace(',', '.'))
    if (
      !Number.isFinite(pv) ||
      pv < 0 ||
      !Number.isFinite(pmt) ||
      pmt < 0 ||
      !Number.isFinite(annual) ||
      !Number.isFinite(p) ||
      p <= 0
    ) {
      return null
    }
    const months = unit === 'years' ? Math.round(p * 12) : Math.round(p)
    if (months <= 0) return null
    const r = annual / 12
    const fvFromPv = pv * Math.pow(1 + r, months)
    const fvFromPmt =
      r === 0 ? pmt * months : (pmt * (Math.pow(1 + r, months) - 1)) / r
    const fv = fvFromPv + fvFromPmt
    const totalContributed = pv + pmt * months
    const interestGain = fv - totalContributed
    return {
      futureValue: fv,
      totalContributed,
      interestGain,
      months,
    }
  }, [principal, monthlyContrib, rateAnnualPct, period, unit])

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">Juros compostos</CardTitle>
        <CardDescription>
          Simule rendimento com valor inicial, aporte mensal recorrente, taxa anual e capitalização mensal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ci-principal">Valor inicial (R$)</Label>
            <Input
              id="ci-principal"
              inputMode="decimal"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ci-pmt">Aporte mensal (R$)</Label>
            <Input
              id="ci-pmt"
              inputMode="decimal"
              placeholder="0,00"
              value={monthlyContrib}
              onChange={(e) => setMonthlyContrib(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ci-rate">Taxa anual (% ao ano)</Label>
            <Input
              id="ci-rate"
              inputMode="decimal"
              value={rateAnnualPct}
              onChange={(e) => setRateAnnualPct(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ci-period">Prazo</Label>
            <Input id="ci-period" inputMode="decimal" value={period} onChange={(e) => setPeriod(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Unidade</Label>
          <Tabs value={unit} onValueChange={(v) => setUnit(v as typeof unit)}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="years">Anos</TabsTrigger>
              <TabsTrigger value="months">Meses</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {result && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Valor futuro estimado
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-primary">{formatCurrency(result.futureValue)}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Total aportado:{' '}
              <span className="font-semibold text-foreground">{formatCurrency(result.totalContributed)}</span>
              {' · '}
              Ganho em juros:{' '}
              <span className="font-semibold text-foreground">{formatCurrency(result.interestGain)}</span>
              {' · '}
              {result.months} {result.months === 1 ? 'mês' : 'meses'} capitalizados
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">
              Em {result.months} {result.months === 1 ? 'mês' : 'meses'}, o montante final fica{' '}
              <span className="text-primary">{formatCurrency(result.futureValue)}</span>
              {result.interestGain > 0
                ? `, com ganho de juros de ${formatCurrency(result.interestGain)} em relação ao que você colocou.`
                : '.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
