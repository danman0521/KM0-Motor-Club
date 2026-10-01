export type SocialNetwork = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'whatsapp'

export const site = {
  name: 'Neutro',
  tagline: 'Hermandad sobre dos ruedas',
  about:
    'Somos un grupo de moteros unidos por la ruta, la mecánica y el respeto. Rodamos juntos, nos cuidamos en la vía y dejamos huella en cada salida.',
  logo: './logo-neutro.webp',
  // Redes sociales del grupo. PENDIENTE: estos enlaces son de ejemplo y llevan a la
  // página principal de cada red; cámbialos por los perfiles reales del grupo.
  // Para ocultar un botón, borra su línea.
  social: [
    { network: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/' },
    { network: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/' },
    { network: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/' },
    { network: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/' },
    { network: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/' },
  ] as { network: SocialNetwork; label: string; url: string }[],
}
