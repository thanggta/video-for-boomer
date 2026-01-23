import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'elderly-sm': '18px',
        'elderly-base': '20px',
        'elderly-lg': '24px',
        'elderly-xl': '28px',
        'elderly-2xl': '32px',
      },
      spacing: {
        'touch': '60px',      // Minimum touch target (60x60px)
        'touch-lg': '80px',   // Large touch target (80x80px)
      },
      colors: {
        primary: {
          DEFAULT: '#2563eb',  // Vibrant blue, high contrast
          light: '#3b82f6',
          dark: '#1d4ed8',
        },
        success: '#16a34a',    // Green
        danger: '#dc2626',     // Red
        grey: {
          light: '#f3f4f6',
          DEFAULT: '#6b7280',
          dark: '#374151',
        }
      },
      borderRadius: {
        'elderly': '12px',     // Larger, easier to see borders
      },
      boxShadow: {
        'elderly': '0 4px 12px rgba(0,0,0,0.15)',  // More prominent shadows
      },
      lineHeight: {
        'relaxed': '1.6',      // Increased line height for readability
      },
      letterSpacing: {
        'relaxed': '0.02em',   // Slightly increased letter spacing
      },
    },
  },
  plugins: [],
};

export default config;
