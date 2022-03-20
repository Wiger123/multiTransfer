const colors = require('tailwindcss/colors');

module.exports = {
  important: true,
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    maxWidth: {
      '1/4': '25%',
      900: '900px',
      '3/4': '75%',
    },
    colors: {
      primary: '#031a6e',
      white: colors.white,
      gray: colors.gray,
      red: colors.red,
      green: colors.green,

      // blue: colors.blue,
      // Configure your color palette here
    },
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    // ...
    maxWidth: true,
  },
};
