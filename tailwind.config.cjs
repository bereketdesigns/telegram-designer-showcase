/** @type {import('tailwindcss').Config} */
module.exports = {
  // Explicitly include all Astro, React components, and CSS files in src/ for Tailwind to scan
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue,css}', // ADD .css here
    './public/**/*.html' // Also good practice for any HTML files in public
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};