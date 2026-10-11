/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // JayaMart identity: navy blue + soft lavender + white + light gray
        navy: {
          50: '#f1f4fb',
          100: '#e3e9f7',
          200: '#c5d0ee',
          300: '#9fb1e0',
          400: '#7189cd',
          500: '#5069b7',
          600: '#3c519b',
          700: '#2f407d',
          800: '#263565',
          900: '#15224a',
          950: '#0d1730',
        },
        lavender: {
          50: '#f7f6fd',
          100: '#efedfb',
          200: '#e1ddf8',
          300: '#cbc4f2',
          400: '#b0a5e9',
          500: '#9586de',
          600: '#7d6bcd',
          700: '#6854b3',
          800: '#574592',
          900: '#483b76',
        },
        canvas: '#f6f7fb',
        line: '#e7e9f2',
      },
      boxShadow: {
        card: '0 1px 2px rgba(21, 34, 74, 0.04), 0 6px 18px rgba(21, 34, 74, 0.06)',
        lift: '0 8px 28px rgba(21, 34, 74, 0.12)',
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
