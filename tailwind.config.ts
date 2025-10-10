import type { Config } from "tailwindcss";

const config: Config = {
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  important: true,
  theme: {
  	extend: {
  		screens: {
  			'xs': '475px',
  			'3xl': '1600px',
  			'4xl': '1920px',
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
  			'icct-primary': 'linear-gradient(to right, #1e40af, #3b82f6)',
  			'icct-success': 'linear-gradient(to right, #10b981, #059669)',
  			'icct-rfid': 'linear-gradient(to right, #8b5cf6, #7c3aed)',
  			'icct-primary-subtle': 'linear-gradient(to bottom right, #1e40af10, #3b82f620)',
  			'icct-success-subtle': 'linear-gradient(to bottom right, #10b98110, #05966920)',
  			'icct-rfid-subtle': 'linear-gradient(to bottom right, #8b5cf610, #7c3aed20)',
  		},
  		colors: {
  			// === Global Semantic Color Tokens ===
  			primary: {
  				DEFAULT: '#1e40af', // text-blue-900
  				foreground: '#ffffff',
  			},
  			secondary: {
  				DEFAULT: '#3b82f6',
  				foreground: '#ffffff',
  			},
  			accent: {
  				DEFAULT: '#6D68FF',
  				foreground: '#ffffff',
  			},
  			light: '#eff6ff', // bg-blue-50
  			dark: '#1e293b',
  			success: '#10b981',
  			warning: '#f59e0b',
  			error: '#ef4444',
  			border: '#e2e8f0',
  			muted: {
  				DEFAULT: '#64748b',
  				foreground: '#f8fafc',
  			},
  			white: '#ffffff',
  			// For button/foreground use (use these in your component logic, not as Tailwind classes):
  			primaryObj: {
  				DEFAULT: '#1e40af',
  				foreground: '#ffffff',
  			},
  			secondaryObj: {
  				DEFAULT: '#3b82f6',
  				foreground: '#ffffff',
  			},
  			accentObj: {
  				DEFAULT: '#6D68FF',
  				foreground: '#ffffff',
  			},
  			mute: {
  				DEFAULT: '#64748b',
  				foreground: '#f8fafc',
  			},
  			// === Legacy ICCT Colors (for reference, prefer semantic above) ===
  			icct: {
  				primary: '#190089',
  				secondary: '#3F9CDE',
  				accent: '#6D68FF',
  				light: '#CFE4FF',
  				dark: '#0A0044',
  				'primary-blue': '#1e40af',
  				'secondary-blue': '#3b82f6',
  				'dark-slate': '#1e293b',
  				'success-green': '#10b981',
  				'warning-amber': '#f59e0b',
  				'error-red': '#ef4444',
  				'rfid-purple': '#8b5cf6',
  				'light-bg': '#f8fafc',
  				'border-gray': '#e2e8f0',
  				'secondary-text': '#64748b',
  				'pure-white': '#ffffff',
  				'success-dark': '#059669',
  				'rfid-dark': '#7c3aed',
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			destructive: {
  				DEFAULT: '#ef4444',
  				foreground: '#ffffff',
  			},
  			input: '#e2e8f0',
  			ring: '#3b82f6',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			"accordion-down": {
  				from: { height: "0" },
  				to: { height: "var(--radix-accordion-content-height)" },
  			},
  			"accordion-up": {
  				from: { height: "var(--radix-accordion-content-height)" },
  				to: { height: "0" },
  			},
  		},
  		animation: {
  			"accordion-down": "accordion-down 0.2s ease-out",
  			"accordion-up": "accordion-up 0.2s ease-out",
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
  corePlugins: {
    preflight: true,
  },
};
export default config;
