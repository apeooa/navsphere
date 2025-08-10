// app/access/page.tsx
export default function AccessPage({
  searchParams,
}: {
  searchParams?: { next?: string }
}) {
  const next = (searchParams?.next && typeof searchParams.next === 'string')
    ? searchParams.next
    : '/'

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        method="POST"
        action="/api/access/login"
        className="w-full max-w-sm rounded-xl border p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold">输入访问密码</h1>

        <input
          type="password"
          name="password"
          required
          placeholder="Password"
          className="w-full rounded-md border px-3 py-2"
        />

        {/* 回跳地址交给服务端处理 */}
        <input type="hidden" name="next" value={next} />

        <button
          type="submit"
          className="w-full rounded-md bg-primary text-primary-foreground py-2"
        >
          进入
        </button>
      </form>
    </div>
  )
}
