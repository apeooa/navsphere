'use client'

import { useState, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function AccessPage() {
  const [pwd, setPwd] = useState('')
  const [pending, start] = useTransition()
  const params = useSearchParams()
  const router = useRouter()
  const next = params.get('next') || '/'

  const submit = () => {
    if (!pwd) return
    start(async () => {
      const res = await fetch('/api/access/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      })
      if (res.ok) {
        router.replace(next)
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data?.error || '密码错误')
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border p-6 space-y-4">
        <h1 className="text-xl font-semibold">输入访问密码</h1>
        <input
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="Password"
          className="w-full rounded-md border px-3 py-2"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button
          onClick={submit}
          disabled={pending}
          className="w-full rounded-md bg-primary text-primary-foreground py-2"
        >
          {pending ? '验证中…' : '进入'}
        </button>
      </div>
    </div>
  )
}
