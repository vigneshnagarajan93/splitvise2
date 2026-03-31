/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sw: {
          teal:       '#1CC29F',
          'teal-dark':'#15A085',
          green:      '#5BC5A7',
          'green-lt': '#E8F5E9',
          orange:     '#FF652F',
          'orange-lt':'#FFF3E0',
          red:        '#E74C3C',
          'red-lt':   '#FDEDEC',
          dark:       '#2C3E50',
          gray:       '#657786',
          'gray-lt':  '#95A5A6',
          bg:         '#F6F6F6',
          card:       '#FFFFFF',
          divider:    '#EEEEEE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card':  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
        'nav':   '0 -1px 12px rgba(0,0,0,0.08)',
        'fab':   '0 4px 16px rgba(255,101,47,0.35)',
        'modal': '0 -8px 32px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-out',
        'slide-up':  'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':  'scaleIn 0.2s ease-out',
        'shimmer':   'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
