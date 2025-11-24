/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        discord: {
          // Discord's actual color palette
          dark: '#2f3136', // Channel sidebar
          darker: '#292b2f', // Server sidebar
          darkest: '#202225', // Server list background
          'darkest-alt': '#1a1c1e',
          gray: '#36393f', // Main background
          'gray-light': '#40444b', // Hover states
          'gray-lighter': '#72767d', // Muted text
          'gray-lightest': '#b9bbbe', // Secondary text
          blue: '#5865f2', // Discord blurple
          'blue-hover': '#4752c4',
          'blue-light': '#5865f2',
          green: '#57f287', // Online status
          'green-dark': '#3ba55d',
          red: '#ed4245', // Delete/error
          'red-hover': '#c03537',
          yellow: '#faa61a', // Idle status
          purple: '#9c84ef', // Do not disturb
          white: '#ffffff',
        },
      },
      fontFamily: {
        sans: [
          'Whitney',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

