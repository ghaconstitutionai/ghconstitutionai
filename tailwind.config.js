/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1a472a',
                secondary: '#2d5016',
                accent: '#ce1126',
                dark: {
                    bg: '#0f0f0f',
                    sidebar: '#1a1a1a',
                    bubble: '#2a2a2a',
                    border: '#333333',
                },
                light: {
                    text: '#e5e5e5',
                    muted: '#a3a3a3',
                }
            },
        },
    },
    plugins: [],
}