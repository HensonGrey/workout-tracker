/** @type {import('tailwindcss').Config} */

// Each colour reads a CSS variable set from src/themes.ts, so switching theme only swaps the variables.
const themeColor = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: themeColor('background'),
        surface: themeColor('surface'),
        border: themeColor('border'),
        text: themeColor('text'),
        'text-muted': themeColor('text-muted'),
        accent: themeColor('accent'),
        'on-accent': themeColor('on-accent'),
        danger: themeColor('danger'),
        success: themeColor('success'),
      },
    },
  },
  plugins: [],
};
