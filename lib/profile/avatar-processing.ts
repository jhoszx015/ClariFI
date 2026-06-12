/** Tipos MIME aceitos no upload local de foto de perfil. */
export const PROFILE_AVATAR_ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const

export const PROFILE_AVATAR_MAX_BYTES = 2 * 1024 * 1024

/** Borda maior após resize no canvas (webp/jpeg). */
const MAX_EDGE_PX = 512

/** Qualidade inicial (JPEG/WEBP). */
const INITIAL_QUALITY = 0.82

function extensionLooksAllowed(fileName: string) {
  return /\.(png|jpe?g|webp)$/i.test(fileName)
}

/**
 * Valida arquivo antes de processamento.
 * `@returns` mensagem amigável ou `null` se ok.
 */
export function validateProfileImageFile(file: File): string | null {
  const typeOk =
    PROFILE_AVATAR_ACCEPTED_TYPES.includes(file.type as (typeof PROFILE_AVATAR_ACCEPTED_TYPES)[number]) ||
    (file.type === '' && extensionLooksAllowed(file.name))
  if (!typeOk) {
    return 'Formato não suportado. Use PNG, JPG, JPEG ou WEBP.'
  }
  if (file.size > PROFILE_AVATAR_MAX_BYTES) {
    return 'O arquivo deve ter no máximo 2 MB.'
  }
  return null
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    img.src = url
  })
}

/**
 * Processa arquivo de imagem: redimensiona, comprime e retorna data URL (demo local).
 */
export async function processProfileImageForStorage(file: File): Promise<string> {
  let source: CanvasImageSource
  let bmp: ImageBitmap | null = null

  try {
    if (typeof createImageBitmap === 'function') {
      bmp = await createImageBitmap(file)
      source = bmp
    } else {
      const blobUrl = URL.createObjectURL(file)
      try {
        source = await loadHtmlImage(blobUrl)
      } finally {
        URL.revokeObjectURL(blobUrl)
      }
    }
  } catch {
    throw new Error('Não foi possível abrir esta imagem. Tente outro arquivo.')
  }

  try {
    const sw = bmp ? bmp.width : (source as HTMLImageElement).naturalWidth || (source as HTMLImageElement).width
    const sh = bmp ? bmp.height : (source as HTMLImageElement).naturalHeight || (source as HTMLImageElement).height
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(sw, sh || 1, 1))
    const dw = Math.max(1, Math.round(sw * scale))
    const dh = Math.max(1, Math.round(sh * scale))

    const canvas = document.createElement('canvas')
    canvas.width = dw
    canvas.height = dh
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Este dispositivo não suportou o pré-processamento.')
    }

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(source as CanvasImageSource, 0, 0, dw, dh)

    const wantPng =
      PROFILE_AVATAR_ACCEPTED_TYPES.includes(file.type as (typeof PROFILE_AVATAR_ACCEPTED_TYPES)[number]) &&
      file.type === 'image/png'

    let quality = INITIAL_QUALITY
    let dataUrl = wantPng
      ? canvas.toDataURL('image/png')
      : canvas.toDataURL('image/jpeg', quality)

    if (!wantPng) {
      while (dataUrl.length > 600_000 && quality > 0.45) {
        quality -= 0.07
        dataUrl = canvas.toDataURL('image/jpeg', quality)
      }
    }

    return dataUrl
  } finally {
    bmp?.close()
  }
}
