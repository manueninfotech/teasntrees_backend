/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bakery: {
                    primary: "#565A47", // Dark Olive text
                    bg: "#FAF1E8", // Warm beige background
                    light: "#FDF5EC", // Lighter beige
                    accent: "#8B8E7B", // Lighter olive
                }
            },
            fontFamily: {
                playfair: ['"Playfair Display"', 'serif'],
            }
        },
    },
    plugins: [],
}
