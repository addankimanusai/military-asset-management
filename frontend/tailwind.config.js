/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tactical: {
          950: '#0b0f19',
          900: '#111827',
          850: '#151e32',
          800: '#1f2937',
          700: '#374151',
          emerald: '#10b981',
          cyan: '#06b6d4',
          amber: '#f59e0b',
          crimson: '#ef4444',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
