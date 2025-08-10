// components/smart-icon.tsx
import * as Icons from 'lucide-react'
import { resolveAssetUrl, isLocalAssetPath } from '@/lib/asset'

type Props = {
  icon?: string
  size?: number
  className?: string
  alt?: string
}

export default function SmartIcon({ icon, size = 16, className, alt = '' }: Props) {
  if (!icon) return null
  const url = resolveAssetUrl(icon)
  const isImg =
    !!url &&
    (url.startsWith('/api/assets/') ||
      /^https?:\/\//i.test(url) ||
      isLocalAssetPath(url))

  if (isImg) {
    return (
      <img
        src={url!}
        alt={alt}
        width={size}
        height={size}
        className={`shrink-0 object-contain ${className ?? ''}`}
        loading="lazy"
      />
    )
  }

  const Lucide = (Icons as any)[icon] || Icons.Circle
  return <Lucide size={size} className={`shrink-0 ${className ?? ''}`} />
}
