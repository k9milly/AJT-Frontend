/** @type {import('tailwindcss').Config} */

// cor vinda de variavel css (definida em src/styles.css) no formato "r g b"
// assim o tailwind consegue aplicar opacidade, ex: bg-primary/10
const token = nome => `rgb(var(--${nome}) / <alpha-value>)`;

module.exports = {
  content: ["./src/**/*.{html,ts}"],

  // o tema escuro do painel e ligado pela classe "dark" no <html> (TemaService)
  // a landing page nao usa variantes dark:, entao nao e afetada
  darkMode: 'class',

  theme: {
    extend: {
      // design tokens do painel administrativo (mesma base do lancamentosVendas/autonomousapi)
      colors: {
        background: token('background'),
        foreground: token('foreground'),
        card: token('card'),
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        muted: token('muted'),
        'muted-foreground': token('muted-foreground'),
        primary: token('primary'),
        'primary-foreground': token('primary-foreground'),
        'primary-hover': token('primary-hover'),
        secondary: token('secondary'),
        'secondary-foreground': token('secondary-foreground'),
        accent: token('accent'),
        'accent-foreground': token('accent-foreground'),
        destructive: token('destructive'),

        'status-info': token('status-info'),
        'status-info-bg': token('status-info-bg'),
        'status-warning': token('status-warning'),
        'status-warning-bg': token('status-warning-bg'),
        'status-success': token('status-success'),
        'status-success-bg': token('status-success-bg'),
        'status-danger': token('status-danger'),
        'status-danger-bg': token('status-danger-bg'),
        'status-neutral': token('status-neutral'),
        'status-neutral-bg': token('status-neutral-bg'),

        sidebar: token('sidebar'),
        'sidebar-foreground': token('sidebar-foreground'),
        'sidebar-muted': token('sidebar-muted'),
        'sidebar-border': token('sidebar-border'),
        'sidebar-active': token('sidebar-active'),
        'sidebar-accent': token('sidebar-accent'),

        'login-bg': token('login-bg'),
        'login-surface': token('login-surface'),
        'login-border': token('login-border'),
        'login-foreground': token('login-foreground'),
        'login-muted': token('login-muted'),
      },
      fontFamily: {
        painel: ['Inter', 'system-ui', 'sans-serif'],
        dados: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'surgir': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'aparecer': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pulsar': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.45' },
        },
      },
      animation: {
        'surgir': 'surgir 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'aparecer': 'aparecer 0.25s ease both',
        'pulsar': 'pulsar 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
