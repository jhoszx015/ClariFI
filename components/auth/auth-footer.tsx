'use client'

export function AuthFooter() {
  return (
    <footer className="shrink-0 py-3 text-center text-xs text-muted-foreground sm:text-sm">
      <p suppressHydrationWarning>
        &copy; {new Date().getFullYear()} ClariFI. Todos os direitos reservados.
      </p>
    </footer>
  )
}
