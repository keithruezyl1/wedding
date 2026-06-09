import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FBF6EE',
        cream: '#F3E9DA',
        sand: '#E7D3B8',
        amber: '#E8A14B',
        coral: '#E07A5F',
        dusk: '#7A5C73',
        charcoal: '#2B2A28',
        ruin: '#C2362F',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: { calm: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    },
  },
  plugins: [],
}
export default config
