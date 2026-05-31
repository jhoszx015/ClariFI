'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/lib/store/auth-store'
import { DashboardPanelBack } from '@/components/clarifi/dashboard-panel-back'
import { diagnosisQuestions } from '@/lib/data/mock-data'
import type { ProfileType, BehavioralProfile } from '@/types'
import { BEHAVIORAL_PROFILES } from '@/lib/data/behavioral-profiles'
import {
  Brain,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  Target,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'

const profileDescriptions = BEHAVIORAL_PROFILES

export default function DiagnosisPage() {
  const { user, updateProfile } = useAuthStore()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(user?.behavioralProfile !== undefined)
  const [isStarted, setIsStarted] = useState(false)

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = optionIndex
    setAnswers(newAnswers)
  }

  const calculateProfile = (): BehavioralProfile => {
    const scores = {
      impulsivity: 0,
      planning: 0,
      organization: 0,
      riskTolerance: 0,
      discipline: 0,
    }

    // Sum up scores from answers
    answers.forEach((answerIndex, questionIndex) => {
      const question = diagnosisQuestions[questionIndex]
      const selectedOption = question.options[answerIndex]
      if (selectedOption?.scores) {
        Object.entries(selectedOption.scores).forEach(([key, value]) => {
          if (value !== undefined) {
            scores[key as keyof typeof scores] += value
          }
        })
      }
    })

    // Normalize scores to 0-100 scale per dimension (based on max available score in each question).
    const maxByDimension = {
      impulsivity: 0,
      planning: 0,
      organization: 0,
      riskTolerance: 0,
      discipline: 0,
    }

    diagnosisQuestions.forEach((q) => {
      ;(Object.keys(maxByDimension) as Array<keyof typeof maxByDimension>).forEach((dimension) => {
        const bestInQuestion = q.options.reduce((best, option) => {
          const val = option.scores[dimension] ?? 0
          return val > best ? val : best
        }, 0)
        maxByDimension[dimension] += bestInQuestion
      })
    })

    ;(Object.keys(scores) as Array<keyof typeof scores>).forEach((key) => {
      const max = maxByDimension[key]
      scores[key] = max > 0 ? Math.round((scores[key] / max) * 100) : 0
    })

    // Perfis alinhados ao modelo de negócio: impulsivo, descontrolado, desatento, poupador (+ equilibrado)
    let profileType: ProfileType = 'equilibrado'

    if (scores.discipline >= 62 && scores.planning >= 55 && scores.impulsivity <= 42) {
      profileType = 'poupador'
    } else if (scores.organization < 38) {
      profileType = 'desatento'
    } else if (scores.impulsivity >= 52 && scores.discipline < 42) {
      profileType = 'descontrolado'
    } else if (scores.impulsivity >= 58) {
      profileType = 'impulsivo'
    }

    const profileInfo = profileDescriptions[profileType]

    return {
      type: profileType,
      scores,
      strengths: profileInfo.strengths,
      risks: profileInfo.risks,
      recommendations: profileInfo.recommendations,
      completedAt: new Date(),
    }
  }

  const handleFinish = () => {
    const profile = calculateProfile()
    updateProfile(profile)
    setShowResults(true)
  }

  const handleRestart = () => {
    setAnswers([])
    setCurrentQuestion(0)
    setShowResults(false)
    setIsStarted(true)
  }

  const progress = ((currentQuestion + 1) / diagnosisQuestions.length) * 100
  const currentQ = diagnosisQuestions[currentQuestion]
  const profile = user?.behavioralProfile
  const profileInfo = profile ? profileDescriptions[profile.type] : null

  const radarData = profile
    ? [
        { attribute: 'Impulsividade', value: profile.scores.impulsivity },
        { attribute: 'Planejamento', value: profile.scores.planning },
        { attribute: 'Organização', value: profile.scores.organization },
        { attribute: 'Tolerância a risco', value: profile.scores.riskTolerance },
        { attribute: 'Disciplina', value: profile.scores.discipline },
      ]
    : []

  // Show results if user has a profile
  if (showResults && profile && profileInfo) {
    return (
      <div className="space-y-6">
        <DashboardPanelBack />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              Seu Perfil Financeiro
            </h1>
            <p className="text-muted-foreground">
              Resultado do diagnóstico comportamental
            </p>
          </div>
          <Button variant="outline" onClick={handleRestart} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refazer diagnóstico
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Card */}
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                  <Brain className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <Badge className="mb-1">{profileInfo.title}</Badge>
                  <CardTitle className="text-xl">Perfil {profileInfo.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{profileInfo.description}</p>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Gráfico de competências</CardTitle>
              <CardDescription>Visualização das suas características financeiras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 22, right: 16, bottom: 8, left: 16 }}>
                    <PolarGrid className="stroke-border" />
                    <PolarAngleAxis
                      dataKey="attribute"
                      className="text-xs"
                      tick={{ fill: 'var(--muted-foreground)' }}
                    />
                    <PolarRadiusAxis
                      angle={24}
                      domain={[0, 100]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      name="Perfil"
                      dataKey="value"
                      stroke="var(--primary)"
                      fill="var(--primary)"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strengths and Risks */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <CardTitle>Seus Pontos Fortes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {profile.strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <CardTitle>Pontos de atenção</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {profile.risks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Recomendações para você</CardTitle>
            </div>
            <CardDescription>
              Sugestões personalizadas baseadas no seu perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {profile.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {user?.profileHistory && user.profileHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de perfis</CardTitle>
              <CardDescription>Evolução do seu diagnóstico comportamental</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[...user.profileHistory].reverse().map((entry, i) => (
                  <li
                    key={i}
                    className="flex flex-col gap-1 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <Badge variant="secondary">
                      {profileDescriptions[entry.profile.type]?.title ?? entry.profile.type}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Score Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento das pontuações</CardTitle>
            <CardDescription>Análise detalhada de cada dimensão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Impulsividade', value: profile.scores.impulsivity },
                { label: 'Planejamento', value: profile.scores.planning },
                { label: 'Organização', value: profile.scores.organization },
                { label: 'Tolerância a risco', value: profile.scores.riskTolerance },
                { label: 'Disciplina', value: profile.scores.discipline },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                  <Progress value={item.value} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show intro screen
  if (!isStarted) {
    return (
      <div className="space-y-6">
        <DashboardPanelBack />
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Diagnóstico comportamental
          </h1>
          <p className="text-muted-foreground">
            Descubra seu perfil financeiro através de perguntas baseadas em psicologia comportamental
          </p>
        </div>

        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Conheça seu perfil financeiro</CardTitle>
            <CardDescription className="text-base">
              Responda {diagnosisQuestions.length} perguntas rápidas e descubra como você lida com dinheiro.
              O resultado vai ajudar o ClariFI a personalizar suas recomendações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <Target className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-2 text-sm font-medium">Personalizado</p>
                <p className="text-xs text-muted-foreground">Recomendações sob medida</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-2 text-sm font-medium">Baseado em ciência</p>
                <p className="text-xs text-muted-foreground">Psicologia comportamental</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-2 text-sm font-medium">Rápido</p>
                <p className="text-xs text-muted-foreground">Menos de 5 minutos</p>
              </div>
            </div>
            <Button size="lg" className="w-full gap-2" onClick={() => setIsStarted(true)}>
              Começar diagnóstico
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show questionnaire
  return (
    <div className="space-y-6">
      <DashboardPanelBack />
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Diagnóstico comportamental
        </h1>
        <p className="text-muted-foreground">
          Pergunta {currentQuestion + 1} de {diagnosisQuestions.length}
        </p>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Progresso</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="mb-4 h-2" />
          <CardTitle className="text-xl">{currentQ.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQ.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className={`w-full rounded-lg border p-4 text-left transition-all ${
                answers[currentQuestion] === index
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    answers[currentQuestion] === index
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  }`}
                >
                  {answers[currentQuestion] === index && (
                    <CheckCircle className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
                <span className={answers[currentQuestion] === index ? 'font-medium' : ''}>
                  {option.text}
                </span>
              </div>
            </button>
          ))}
        </CardContent>
        <div className="flex justify-between border-t p-6">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          {currentQuestion < diagnosisQuestions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              disabled={answers[currentQuestion] === undefined}
              className="gap-2"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={answers[currentQuestion] === undefined}
              className="gap-2"
            >
              Ver Resultado
              <Sparkles className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
