import { redirect } from 'next/navigation'

/** Rota antiga: planejamento foi unificado em Investimentos. */
export default function PlanejamentoRedirectPage() {
  redirect('/dashboard/investimentos')
}
