/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#1f2228',
          text: '#ffffff',
        },
      },
      fontFamily: {
        mono: ['GeistMono', 'ui-monospace', 'SFMono-Regular', 'Roboto Mono', 'Menlo', 'Monaco', 'Liberation Mono', 'DejaVu Sans Mono', 'Courier New'],
        sans: ['universalSans', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '24px',
        'lg': '48px',
      },
      borderRadius: {
        'none': '0px',
        'xs': '4px',
      },
      fontSize: {
        'display': ['320px', { lineHeight: '1.5', fontWeight: '300', fontFamily: 'GeistMono' }],
        'heading': ['30px', { lineHeight: '1.2', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'label': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'small': ['12px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      letterSpacing: {
        'tight': '-0.02em',
        'normal': '0em',
        'button': '1.4px',
      },
    },
  },
  plugins: [],
};
