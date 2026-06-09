import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'

// Node.js < 22 has no native WebSocket; provide a stub so createClient doesn't
// throw at import time in test/server environments.  Browsers always have it.
const wsTransport: typeof WebSocket =
  typeof WebSocket !== 'undefined'
    ? WebSocket
    : (class NoopWS {
        static CONNECTING = 0
        static OPEN = 1
        static CLOSING = 2
        static CLOSED = 3
        constructor(_url: string) { void _url }
        close() {}
        send() {}
        addEventListener() {}
        removeEventListener() {}
        dispatchEvent() { return false }
      } as unknown as typeof WebSocket)

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
  realtime: { transport: wsTransport },
})
