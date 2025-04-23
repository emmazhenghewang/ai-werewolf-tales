import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				// Balatro-modern vibrant palette!
				'balatro-bg-dark': '#1A1F2C',
				'balatro-purple': '#9b87f5',
				'balatro-purple-secondary': '#7E69AB',
				'balatro-purple-tertiary': '#6E59A5',
				'balatro-glass': 'rgba(255,255,255,0.07)',
				'balatro-glass-light': 'rgba(225,225,245,0.16)',
				'balatro-orange': '#FFA99F',
				'balatro-accent': '#D6BCFA',
        // Accent gradients, foregrounds...
			},
			backgroundImage: {
				'balatro-radial': "radial-gradient(circle at 80% 20%, #D6BCFA 0%, #7E69AB 42%, #1A1F2C 100%)",
				'balatro-card': "linear-gradient(135deg, #ece9f6cc 0%, #f0d6fc70 96%)",
				'balatro-glass-dense': "linear-gradient(135deg, rgba(155,135,245,0.12) 0%, rgba(30,31,44,0.43) 100%)",
				'balatro-btn': 'linear-gradient(90deg, #9b87f5 0%, #FFA99F 100%)',
			},
			boxShadow: {
				'balatro': '0 8px 24px 0 rgba(144,85,255,0.12), 0 1.5px 7px 0 rgba(241,209,255,0.05)'
			},
			fontFamily: {
				'balatro': ['Playfair Display', 'serif'],
				'medieval': ['MedievalSharp', 'cursive'],
				'parchment': ['Uncial Antiqua', 'cursive'],
			},
			borderRadius: {
				balatro: '1.5rem',
			},
			animation: {
				'fade-in': 'fade-in 0.5s ease-out',
			},
			keyframes: {
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
