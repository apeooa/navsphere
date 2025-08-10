export const runtime = 'edge'
export async function POST() {
  return new Response(null, {
    status: 204,
    headers: {
      'Set-Cookie': 'ns_access=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax',
    },
  })
}
