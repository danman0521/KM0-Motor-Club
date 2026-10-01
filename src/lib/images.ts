import imageCompression from 'browser-image-compression'
import { UserError } from './errors'

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/** Reduce la foto en el navegador antes de subirla (por defecto lado mayor 1600 px, ~300 KB, JPEG). */
export async function compressPhoto(
  file: File,
  { maxSide = 1600, maxSizeMB = 0.3 }: { maxSide?: number; maxSizeMB?: number } = {},
): Promise<File> {
  if (!isImageFile(file)) throw new UserError('Solo se pueden subir imágenes.')
  return imageCompression(file, {
    maxWidthOrHeight: maxSide,
    maxSizeMB,
    fileType: 'image/jpeg',
    useWebWorker: true,
  })
}
