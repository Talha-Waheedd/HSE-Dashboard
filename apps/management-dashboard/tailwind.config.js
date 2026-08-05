/** @type {import('tailwindcss').Config} */
import sharedConfig from "@cbl/ui/tailwind.config.js";

export default {
  ...sharedConfig,
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    ...sharedConfig.theme,
    extend: {
      ...sharedConfig.theme?.extend,
      colors: {
        ...sharedConfig.theme?.extend?.colors,
        // Semantic status colors — SAP / Microsoft enterprise palette
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          light: "hsl(var(--success-light))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          light: "hsl(var(--warning-light))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))",
          light: "hsl(var(--danger-light))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          light: "hsl(var(--info-light))",
        },
        // Status badge token map
        status: {
          open:      '#F59E0B',
          closed:    '#1B7C1B',
          progress:  '#2563EB',
          overdue:   '#CB0017',
          pending:   '#D97706',
          cancelled: '#6B7280',
        }
      },
      fontFamily: {
        ...sharedConfig.theme?.extend?.fontFamily,
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        ...sharedConfig.theme?.extend?.fontSize,
        'page-title':    ['20px', { lineHeight: '1.3', fontWeight: '700' }],
        'section-title': ['15px', { lineHeight: '1.4', fontWeight: '600' }],
        'table-header':  ['11px', { lineHeight: '1.4', fontWeight: '700', letterSpacing: '0.06em' }],
        'caption':       ['11px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      boxShadow: {
        ...sharedConfig.theme?.extend?.boxShadow,
        'enterprise':       '0 1px 4px 0 rgba(0,0,0,0.06)',
        'enterprise-hover': '0 3px 14px 0 rgba(0,0,0,0.10)',
        'enterprise-lg':    '0 8px 32px 0 rgba(0,0,0,0.12)',
      },
    }
  }
}
