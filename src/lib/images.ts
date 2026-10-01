import imageCompression from 'browser-image-compression'
import { UserError } from './errors'

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/** Reduce la foto en el navegador antes de subirla (lado mayor 1600 px, ~300 KB, JPEG). */
export async function compressPhoto(file: File): Promise<File> {
  if (!isImageFile(file)) throw new UserError('Solo se pueden subir imágenes.')
  return imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 0.3,
    fileType: 'image/jpeg',
    useWebWorker: true,
  })
}
