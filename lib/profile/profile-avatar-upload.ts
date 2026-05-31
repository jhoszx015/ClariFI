/**
 * Ponto único futuro para envio ao backend/CDN (S3, uploads assinados, etc.).
 * Hoje apenas documenta contrato esperado pela UI.
 *
 * `@returns` URL pública da imagem quando integrado (ou mesma forma que persistência atual).
 */
export async function uploadProfileAvatarToStorage(_file: File): Promise<string> {
  throw new Error('Upload remoto não configurado nesta demonstração.')
}
