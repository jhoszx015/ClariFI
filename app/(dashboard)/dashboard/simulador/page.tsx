import { redirect } from 'next/navigation'

/** Simulador de decisão foi descontinuado. */
export default function SimuladorRedirectPage() {
  redirect('/dashboard')
}
