import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        coral: '#F26741',
        blue: {
          joyn: '#3B9FE8',
        },
        green: {
          joyn: '#22C55E',
        },
        ink: '#1a1a1a',
        surface: '#faf9f7',
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        'card-lg': '18px',
        btn: '50px',
      },
      // Design system: max content width is 390px (mobile-first)
      maxWidth: {
        mobile: '390px',
      },
    },
  },
  plugins: [],
}

export default config
