import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: '' }))
  const ok = typeof password === 'string' && password === process.env.GATE_PASSWORD
  return NextResponse.json({ ok }, { status: ok ? 200 : 401 })
}
