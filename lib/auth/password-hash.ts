/** Hash SHA-256 para não persistir senha em texto puro (demo local). */
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Hash conhecido da senha seed da demo (123456). */
export const SEED_DEMO_PASSWORD_HASH =
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d9a86aff3ca12020c923adc6c92'

export async function verifyStoredPassword(
  password: string,
  row: { password?: string; passwordHash?: string },
): Promise<boolean> {
  if (row.passwordHash) {
    return (await hashPassword(password)) === row.passwordHash
  }
  if (row.password) {
    return row.password === password
  }
  return false
}
