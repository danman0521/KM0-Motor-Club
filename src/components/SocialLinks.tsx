import { siFacebook, siInstagram, siTiktok, siWhatsapp, siYoutube } from 'simple-icons'
import { site, type SocialNetwork } from '../config/site'

const icons: Record<SocialNetwork, { path: string }> = {
  instagram: siInstagram,
  facebook: siFacebook,
  tiktok: siTiktok,
  youtube: siYoutube,
  whatsapp: siWhatsapp,
}

/** Botones que llevan a las redes sociales del grupo (definidas en `config/site.ts`). */
export function SocialLinks({ size = 'md' }: { size?: 'sm' | 'md' }) {
  if (site.social.length === 0) return null
  const box = size === 'md' ? 'h-11 w-11' : 'h-9 w-9'
  const icon = size === 'md' ? 'h-5 w-5' : 'h-4 w-4'

  return (
    <ul className="flex flex-wrap items-center justify-center gap-2" aria-label="Redes sociales">
      {site.social.map((s) => (
        <li key={s.network}>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${s.label} de ${site.name}`}
            title={s.label}
            className={`${box} inline-flex items-center justify-center rounded-full border border-line text-steel transition-colors hover:border-red hover:bg-red hover:text-ink`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={icon}>
              <path d={icons[s.network].path} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  )
}
