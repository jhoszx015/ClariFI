export const PASSWORD_MIN_LENGTH = 8

export type PasswordRequirement = {
  id: string
  label: string
  valid: boolean
}

export function getPasswordRequirements(
  password: string,
  confirmPassword?: string,
): PasswordRequirement[] {
  const requirements: PasswordRequirement[] = [
    {
      id: 'length',
      label: `Mínimo de ${PASSWORD_MIN_LENGTH} caracteres`,
      valid: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      id: 'upper',
      label: 'Letra maiúscula',
      valid: /[A-Z]/.test(password),
    },
    {
      id: 'lower',
      label: 'Letra minúscula',
      valid: /[a-z]/.test(password),
    },
    {
      id: 'number',
      label: 'Número',
      valid: /\d/.test(password),
    },
    {
      id: 'special',
      label: 'Caracter especial',
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ]

  if (confirmPassword !== undefined) {
    requirements.push({
      id: 'match',
      label: 'Senhas coincidem',
      valid: password.length > 0 && password === confirmPassword,
    })
  }

  return requirements
}

export function isStrongPassword(password: string, confirmPassword?: string): boolean {
  return getPasswordRequirements(password, confirmPassword).every((req) => req.valid)
}
