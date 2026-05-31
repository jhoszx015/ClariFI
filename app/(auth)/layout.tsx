import Link from 'next/link'
import { Wallet } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">ClariFI</span>
          </Link>
        </header>

        {/* Content */}
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ClariFI. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  )
}
