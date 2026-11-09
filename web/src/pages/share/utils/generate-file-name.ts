import { generateCode } from './generate-code'

const EXTENSIONS: Record<string, string> = {
  'text/plain': 'txt',
  'text/html': 'html',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
}

export function generateFileName(mime: string) {
  const type = mime.split(';', 1)[0].trim().toLowerCase()
  const extension = EXTENSIONS[type] ?? 'bin'

  return `${generateCode()}.${extension}`
}
