'use client'

// Warm, on-theme palette for default avatars.
const PALETTE = ['#E07A5F', '#E8A14B', '#7A5C73', '#B07A4F', '#9C6B5E', '#C2745A']

function hashIndex(s: string, n: number): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % n
}

export default function LetterAvatar({
  name, avatarUrl, size = 40, className = '',
}: {
  name: string
  avatarUrl?: string | null
  size?: number
  className?: string
}) {
  const letter = (name.trim()[0] || '?').toUpperCase()
  const color = PALETTE[hashIndex(name.trim().toLowerCase(), PALETTE.length)]
  const dims = { width: size, height: size }

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt={name} style={dims}
        className={`rounded-full object-cover ${className}`} />
    )
  }

  return (
    <div style={{ ...dims, backgroundColor: color }}
      className={`flex items-center justify-center rounded-full ${className}`}>
      <span className="font-serif font-semibold text-white select-none leading-none"
        style={{ fontSize: Math.round(size * 0.42) }}>
        {letter}
      </span>
    </div>
  )
}
