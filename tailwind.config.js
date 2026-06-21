/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          light: '#F7E7A6',
          mid: '#D6BC63',
          deep: '#A8862C',
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #F7E7A6 0%, #D6BC63 50%, #A8862C 100%)',
      },
    },
  },
  plugins: [],
}
