'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useFinanceStore } from '@/lib/store/finance-store'
import { DashboardPanelBack } from '@/components/clarifi/dashboard-panel-back'
import { availableBanks } from '@/lib/data/mock-data'
import { resolveBankLogoUrl } from '@/lib/data/bank-logos'
import {
  Building2,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle,
  Shield,
  Clock,
  Wallet,
  Link2,
  Loader2,
} from 'lucide-react'
import Image from 'next/image'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const bankVisuals: Record<string, { color: string; accent: string }> = {
  nubank: { color: '#8A05BE', accent: '#F3E8FF' },
  itau: { color: '#EC7000', accent: '#FFF2E8' },
  bradesco: { color: '#CC092F', accent: '#FFE8ED' },
  santander: { color: '#EC0000', accent: '#FFECEC' },
  inter: { color: '#FF7A00', accent: '#FFF0E5' },
  xp: { color: '#111111', accent: '#F2F2F2' },
  default: { color: '#64748B', accent: '#F1F5F9' },
}

const getBankVisual = (name: string) => {
  const key = name.toLowerCase()
  if (key.includes('nubank')) return bankVisuals.nubank
  if (key.includes('itau')) return bankVisuals.itau
  if (key.includes('bradesco')) return bankVisuals.bradesco
  if (key.includes('santander')) return bankVisuals.santander
  if (key.includes('inter')) return bankVisuals.inter
  if (key.includes('xp')) return bankVisuals.xp
  return bankVisuals.default
}

const SIMULATED_OAUTH_STEP_MS = process.env.NODE_ENV === 'production' ? 0 : 250
const SIMULATED_SYNC_MS = process.env.NODE_ENV === 'production' ? 0 : 300

export default function BankConnectionPage() {
  const bankConnections = useFinanceStore((state) => state.bankConnections)
  const connectBank = useFinanceStore((state) => state.connectBank)
  const disconnectBank = useFinanceStore((state) => state.disconnectBank)
  const syncBank = useFinanceStore((state) => state.syncBank)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStep, setConnectionStep] = useState(0)
  const [selectedBank, setSelectedBank] = useState<{ id: string; name: string; color: string } | null>(null)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({})

  const handleConnectBank = async (bank: { id: string; name: string; color: string }) => {
    setSelectedBank(bank)
    setIsConnecting(true)
    setConnectionStep(1)

    if (SIMULATED_OAUTH_STEP_MS > 0) {
      await new Promise((resolve) => setTimeout(resolve, SIMULATED_OAUTH_STEP_MS))
    }
    setConnectionStep(2)

    if (SIMULATED_OAUTH_STEP_MS > 0) {
      await new Promise((resolve) => setTimeout(resolve, SIMULATED_OAUTH_STEP_MS))
    }
    setConnectionStep(3)

    if (SIMULATED_OAUTH_STEP_MS > 0) {
      await new Promise((resolve) => setTimeout(resolve, SIMULATED_OAUTH_STEP_MS))
    }
    
    connectBank(bank.id, bank.name)
    setIsConnecting(false)
    setConnectionStep(0)
    setSelectedBank(null)
  }

  const handleSyncBank = async (id: string) => {
    setIsSyncing(id)
    if (SIMULATED_SYNC_MS > 0) {
      await new Promise((resolve) => setTimeout(resolve, SIMULATED_SYNC_MS))
    }
    syncBank(id)
    setIsSyncing(null)
  }

  const totalBalance = bankConnections.reduce((sum, b) => sum + b.balance, 0)
  const connectedBanks = bankConnections.length
  const availableToConnect = availableBanks.filter(
    (b) => !bankConnections.some((bc) => bc.bankName.toLowerCase() === b.name.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <DashboardPanelBack />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Conexão bancária — Em breve</h1>
        <p className="text-muted-foreground">
          Estamos trabalhando na integração com Open Finance. Por enquanto, adicione suas transações manualmente em
          Transações.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Em breve disponível via Open Finance</CardTitle>
          </div>
          <CardDescription className="text-sm leading-relaxed">
            A conexão automática com bancos permitirá importar extratos e saldos com seu consentimento. Enquanto
            isso, o cadastro manual em Transações já oferece controle real do seu orçamento e alertas
            comportamentais.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Total
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">em todas as contas conectadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contas Conectadas
            </CardTitle>
            <Building2 className="h-4 w-4 text-emerald" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald">{connectedBanks}</div>
            <p className="text-xs text-muted-foreground">instituições financeiras</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Segurança
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                <CheckCircle className="h-3 w-3" />
                Open Finance
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Conexão segura e criptografada</p>
          </CardContent>
        </Card>
      </div>

      {/* Connected Banks */}
      <Card>
        <CardHeader>
          <CardTitle>Contas Conectadas</CardTitle>
          <CardDescription>Gerencie suas conexões bancárias</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bankConnections.length > 0 ? (
            bankConnections.map((connection) => (
              (() => {
                const visual = getBankVisual(connection.bankName)
                const logoSrc =
                  resolveBankLogoUrl({
                    bankId: connection.bankInstitutionId,
                    bankName: connection.bankName,
                  }) ?? connection.bankLogo
                return (
              <div
                key={connection.id}
                className="flex items-center justify-between rounded-lg border border-border/50 p-4"
                style={{ borderLeftWidth: 4, borderLeftColor: visual.color }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: visual.accent }}
                  >
                    {!logoErrors[connection.id] ? (
                      <Image
                        src={logoSrc}
                        alt={connection.bankName}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-md object-contain"
                        onError={() =>
                          setLogoErrors((prev) => ({
                            ...prev,
                            [connection.id]: true,
                          }))
                        }
                      />
                    ) : (
                      <span className="text-sm font-bold" style={{ color: visual.color }}>
                        {connection.bankName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{connection.bankName}</p>
                      <Badge variant="secondary" className="text-xs">
                        {connection.accountType === 'checking'
                          ? 'Conta Corrente'
                          : connection.accountType === 'savings'
                          ? 'Poupança'
                          : 'Cartão de crédito'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {formatCurrency(connection.balance)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Atualizado{' '}
                        {new Date(connection.lastSync).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncBank(connection.id)}
                    disabled={isSyncing === connection.id}
                  >
                    {isSyncing === connection.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectBank(connection.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
                )
              })()
            ))
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Building2 className="mx-auto h-12 w-12 opacity-30" />
              <p className="mt-4">Nenhuma conta conectada</p>
              <p className="text-sm">Conecte suas contas para começar a importar transações</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Banks */}
      <Card>
        <CardHeader>
          <CardTitle>Conectar Nova Conta</CardTitle>
          <CardDescription>
            Selecione sua instituição financeira para conectar via Open Finance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableToConnect.map((bank) => {
              const catalogLogo = resolveBankLogoUrl({ bankId: bank.id, bankName: bank.name })
              return (
              <button
                key={bank.id}
                onClick={() => handleConnectBank(bank)}
                className="flex items-center gap-3 rounded-lg border border-border/50 p-4 text-left transition-all hover:border-primary/50 hover:bg-muted/50"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: bank.color + '20' }}
                >
                  {!logoErrors[bank.id] ? (
                    <Image
                      src={catalogLogo ?? `/banks/${bank.id}.png`}
                      alt={bank.name}
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded object-contain"
                      onError={() =>
                        setLogoErrors((prev) => ({
                          ...prev,
                          [bank.id]: true,
                        }))
                      }
                    />
                  ) : (
                    <Building2 className="h-5 w-5" style={{ color: bank.color }} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{bank.name}</p>
                  <p className="text-xs text-muted-foreground">Clique para conectar</p>
                </div>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="bg-muted/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Segurança das suas informações</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Conexão criptografada',
                description: 'Todos os dados são transmitidos com criptografia de ponta a ponta.',
              },
              {
                title: 'Open Finance',
                description: 'Utilizamos o padrão regulamentado pelo Banco Central do Brasil.',
              },
              {
                title: 'Somente Leitura',
                description: 'Nunca temos acesso para movimentar ou alterar suas contas.',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connection Dialog */}
      <Dialog open={isConnecting} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Conectando {selectedBank?.name}
            </DialogTitle>
            <DialogDescription>
              Aguarde enquanto estabelecemos uma conexão segura
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <Progress value={connectionStep * 33.33} className="h-2" />
            <div className="space-y-4">
              {[
                { step: 1, label: 'Iniciando conexão segura...' },
                { step: 2, label: 'Autenticando com o banco...' },
                { step: 3, label: 'Importando dados da conta...' },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  {connectionStep >= item.step ? (
                    connectionStep > item.step ? (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted" />
                  )}
                  <span
                    className={
                      connectionStep >= item.step ? 'text-foreground' : 'text-muted-foreground'
                    }
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <p className="text-xs text-muted-foreground">
              Conexão criptografada e segura via Open Finance
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
