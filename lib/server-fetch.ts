// lib/server-fetch.ts
import { headers } from 'next/headers'

export function serverFetch(input: string | URL, init: RequestInit = {}) {
  const cookie = headers().get('cookie') ?? ''
  return fetch(input, {
    ...init,
    cache: 'no-store',
    headers: { ...(init.headers || {}), cookie },
  })
}
