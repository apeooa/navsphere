import Image from 'next/image'
import * as Icons from 'lucide-react'
import { resolveAssetUrl, isLocalAssetPath } from '@/lib/asset'

export default function SmartIcon({ icon, size = 16 }: { icon?: string; size?: number }) {
  if (!icon) return null
  const url = resolveAssetUrl(icon)
  const isImg = !!url && (
    url.startsWith('/api/assets/') ||
    /^https?:\/\//i.test(url) ||
    isLocalAssetPath(url)
  )
  if (isImg) return <Image src={url!} alt="" width={size} height={size} unoptimized />
  const Lucide = (Icons as any)[icon] || Icons.Circle
  return <Lucide className="shrink-0" size={size} />
}
