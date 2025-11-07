import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0F172A',
        electric: '#2563EB',
        orange: '#F97316',
        anthracite: '#1E293B',
        graym: '#64748B',
        grayl: '#F1F5F9',
        white: '#FFFFFF',
        success: '#10B981',
        error: '#EF4444'
      },
      borderRadius: {
        lg: '12px',
        md: '8px'
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0,0,0,0.1)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      fontSize: {
        h1: ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
        h2: ['2.25rem', { lineHeight: '1.15', fontWeight: '700' }],
        h3: ['1.5rem', { lineHeight: '1.2', fontWeight: '600' }],
        body: ['1.125rem', { lineHeight: '1.7' }],
        small: ['1rem', { lineHeight: '1.6' }]
      }
    }
  },
  plugins: [],
}
export default config
