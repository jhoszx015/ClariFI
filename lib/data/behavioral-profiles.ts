import type { ProfileType } from '@/types'

export const BEHAVIORAL_PROFILES: Record<
  ProfileType,
  {
    title: string
    description: string
    strengths: string[]
    risks: string[]
    recommendations: string[]
  }
> = {
  impulsivo: {
    title: 'Impulsivo',
    description:
      'Você decide rápido e é influenciado pelo humor do momento. Compras emocionais e picos de gasto são comuns — o padrão é a velocidade, não a falta total de noção do dinheiro.',
    strengths: ['Agilidade nas decisões', 'Capaz de aproveitar oportunidades', 'Menos paralisia por excesso de análise'],
    risks: ['Compras por impulso', 'Orçamento estourado em dias bons ou ruins', 'Dificuldade em esperar para comprar'],
    recommendations: ['Ative alertas inteligentes e o modo foco no ClariFI', 'Use delay de compra (48h) para valores acima do seu teto', 'Defina limites por categoria nas travas de impulsividade'],
  },
  descontrolado: {
    title: 'Descontrolado',
    description:
      'O gasto foge do planejado com frequência: mês a mês fica difícil fechar as contas ou manter limites. O problema é menos “um impulso” e mais o conjunto do comportamento fora de controle.',
    strengths: ['Consciência de que precisa mudar e busca de ferramentas', 'Potencial de virada com travas e alertas'],
    risks: ['Endividamento ou uso do limite do cartão', 'Falta de sobra no fim do mês', 'Ciclo de culpa e novo gasto'],
    recommendations: ['Configure limites mensais por categoria e acompanhe no dashboard', 'Conecte contas (Open Finance) para ver o real', 'Combine coach financeiro com metas pequenas e vencedoras'],
  },
  desatento: {
    title: 'Desatento',
    description:
      'Você não acompanha de perto extratos e vencimentos. O dinheiro “some” porque o hábito de olhar é pouco, não necessariamente porque gasta demais em tudo.',
    strengths: ['Flexibilidade no dia a dia', 'Baixa ansiedade com planilhas', 'Abertura a automatizar o básico'],
    risks: ['Multas, juros e assinaturas esquecidas', 'Surpresas no extrato', 'Metas que param no papel'],
    recommendations: ['Centralize contas e categorização automática no ClariFI', 'Ative alertas de orçamento e de padrões (ex.: gasto após 22h)', 'Revise uma vez por semana só o resumo do app'],
  },
  poupador: {
    title: 'Poupador',
    description:
      'Você prioriza segurança, reserva e metas. Tende a evitar dívidas desnecessárias e a construir patrimônio com disciplina — perfil alinhado a longo prazo.',
    strengths: ['Disciplina e constância', 'Boa visão de reserva e metas', 'Controle emocional acima da média'],
    risks: ['Excesso de cautela e perda de oportunidades', 'Rigidez que gera frustração', 'Inflação corroendo poder de compra se tudo ficar parado'],
    recommendations: ['Automatize aportes e revise metas anualmente', 'Reserve um percentual para lazer sem culpa', 'Explore gradualmente diversificação alinhada ao seu perfil'],
  },
  equilibrado: {
    title: 'Equilibrado',
    description: 'Você equilibra gastar e poupar com razoável consistência, sem extremos claros de impulsividade ou desatenção.',
    strengths: ['Adaptação entre presente e futuro', 'Boa base para metas maiores', 'Menos drama financeiro no dia a dia'],
    risks: ['Acomodação em períodos confortáveis', 'Metas que poderiam ser mais ambiciosas'],
    recommendations: [
      'Mantenha o hábito de revisar o painel uma vez por mês',
      'Use metas simples e aporte pouco a pouco',
      'Quando tiver dúvida, anote o gasto e revise com calma no fim da semana',
    ],
  },
}
