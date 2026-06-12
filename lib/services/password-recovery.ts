const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string) {
  return EMAIL_REGEX.test(email.trim())
}

export async function requestPasswordRecovery(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase()

  if (!isValidEmail(normalizedEmail)) {
    throw new Error('Informe um email válido.')
  }

  const endpoint = process.env.NEXT_PUBLIC_PASSWORD_RECOVERY_ENDPOINT

  if (!endpoint) {
    throw new Error(
      'A recuperação de senha por e-mail ainda não está disponível. Entre em contato pelo suporte.',
    )
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizedEmail }),
  })

  if (!response.ok) {
    throw new Error('Não foi possível enviar o email de recuperação agora.')
  }
}
