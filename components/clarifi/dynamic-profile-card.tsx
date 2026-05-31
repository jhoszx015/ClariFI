'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { DynamicBehaviorSnapshot } from '@/types'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity } from 'lucide-react'

const kindLabels: Record<DynamicBehaviorSnapshot['kind'], string> = {
  controlado: 'Controlado',
  estrategico: 'Estratégico',
  impulsivo: 'Impulsivo',
  ansioso: 'Ansioso',
  instavel: 'Instável',
  em_evolucao: 'Em evolução',
}

/** Resumo do perfil comportamental dinâmico + mini série de impulsividade. */
export function DynamicProfileCard({ snapshot, className }: { snapshot: DynamicBehaviorSnapshot; className?: string }) {
  const chartData = snapshot.history.map((h, i) => ({
    i: i + 1,
    idx: h.impulsivityIndex,
    label: new Date(h.at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
  }))

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle>Perfil comportamental (ao vivo)</CardTitle>
        </div>
        <CardDescription>
          Atualizado com base em gastos recentes, horários e metas — complementa seu diagnóstico inicial.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-lg font-semibold">{kindLabels[snapshot.kind]}</span>
            <span className="text-sm text-muted-foreground">Índice {snapshot.impulsivityIndex}/100</span>
          </div>
          <Progress value={snapshot.impulsivityIndex} className="mt-2 h-2" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{snapshot.summary}</p>
        <ul className="list-disc space-y-1 pl-4 text-sm text-foreground/90">
          {snapshot.tips.slice(0, 3).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
        {chartData.length > 1 && (
          <div className="h-[140px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} width={24} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v}`, 'Impulsividade']}
                />
                <Line
                  type="monotone"
                  dataKey="idx"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
