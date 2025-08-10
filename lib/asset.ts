// lib/asset.ts
export const isLocalAssetPath = (p?: string) =>
  !!p && /^\/(public\/)?assets\/.+\.(png|jpe?g|gif|webp|svg|ico)$/i.test(p)

export function resolveAssetUrl(p?: string) {
  if (!p || /^https?:\/\//i.test(p) || p.startsWith('data:')) return p
  if (!isLocalAssetPath(p)) return p                // 像 "FolderKanban" 这种图标名不动
  const clean = p.replace(/^\/+/, '')
  const repoPath = clean.startsWith('assets/') ? `public/${clean}` : clean
  return `/api/assets/${repoPath}`                  // 走代理 API（私库可读）
}
