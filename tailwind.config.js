/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme'
import colors from 'tailwindcss/colors'
import forms from '@tailwindcss/forms'
import variables from '@mertasan/tailwindcss-variables'
import typography from '@tailwindcss/typography'

// QuickZap brand palette — matched to the official logo (#10B981 green, #FFD700 gold)
const primary = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981' /* Official brand green */,
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b'
}

// QuickZap lightning-bolt gold accent (#FFD700)
const accent = {
  50: '#fffbeb',
  100: '#fff4c2',
  200: '#ffea85',
  300: '#ffe14d',
  400: '#ffd91f',
  500: '#ffd700' /* Official accent gold */,
  600: '#d4af00',
  700: '#a88a00',
  800: '#7d6700',
  900: '#524300'
}

export const themeColors = {
  primary: primary,
  accent: accent,
  secondary: colors.gray,
  success: colors.emerald,
  warning: accent,
  danger: colors.rose,
  info: colors.indigo,
  dark: colors.slate
}

export default {
  darkMode: 'class',
  content: [
    './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
    './storage/framework/views/*.php',
    './resources/views/**/*.blade.php',
    './resources/js/**/*.vue',
    './modules/**/resources/**/*.vue',
    './app/Http/Controllers/**/*.php'
  ],
  theme: {
    fontFamily: {
      sans: ['"Plus Jakarta Sans"', 'Poppins', ...defaultTheme.fontFamily.sans],
      display: [
        '"Bricolage Grotesque"',
        '"Sora"',
        '"Plus Jakarta Sans"',
        ...defaultTheme.fontFamily.sans
      ]
    },
    container: {
      center: true,
      screens: {
        sm: '100%',
        md: '100%',
        lg: '100%',
        xl: '100%',
        '2xl': '1536px'
      }
    },
    extend: {
      transitionProperty: {
        width: 'width',
        height: 'height',
        margin: 'margin'
      },
      keyframes: {
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'face-in-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'fade-in': {
          '0%': {
            opacity: '0'
          },
          '100%': {
            opacity: '1'
          }
        },
        'fade-out': {
          '0%': {
            opacity: '1'
          },
          '100%': {
            opacity: '0'
          }
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 250ms ease-in-out',
        'fade-in-down': 'fade-in-down 250ms ease-in-out',
        'fade-in': 'fade-in 250ms ease-in-out',
        'fade-out': 'fade-out 250ms ease-in-out'
      },
      colors: themeColors,
      variables: {
        DEFAULT: {
          ...themeColors
        }
      },
      borderRadius: {
        primary: '0.75rem'
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(16, 24, 40, 0.06), 0 4px 16px -4px rgba(16, 24, 40, 0.08)',
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 6px 24px -8px rgba(16, 24, 40, 0.10)',
        brand: '0 8px 24px -6px rgba(21, 179, 100, 0.35)'
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.slate.700'),
            '--tw-prose-headings': theme('colors.slate.700'),
            '--tw-prose-lead': theme('colors.slate.600'),
            '--tw-prose-links': theme('colors.primary.500'),
            '--tw-prose-bold': theme('colors.slate.700'),
            '--tw-prose-counters': theme('colors.slate.600'),
            '--tw-prose-bullets': theme('colors.slate.700'),
            '--tw-prose-hr': theme('colors.slate.200'),
            '--tw-prose-quotes': theme('colors.slate.600'),
            '--tw-prose-quote-borders': theme('colors.slate.200'),
            '--tw-prose-captions': theme('colors.slate.600'),
            '--tw-prose-code': theme('colors.slate.700'),
            '--tw-prose-pre-code': theme('colors.slate.200'),
            '--tw-prose-pre-bg': theme('colors.slate.900'),
            '--tw-prose-th-borders': theme('colors.slate.200'),
            '--tw-prose-td-borders': theme('colors.slate.200'),
            '--tw-prose-invert-body': theme('colors.slate.200'),
            '--tw-prose-invert-headings': theme('colors.slate.200'),
            '--tw-prose-invert-lead': theme('colors.slate.300'),
            '--tw-prose-invert-links': theme('colors.primary.500'),
            '--tw-prose-invert-bold': theme('colors.slate.200'),
            '--tw-prose-invert-counters': theme('colors.slate.300'),
            '--tw-prose-invert-bullets': theme('colors.slate.200'),
            '--tw-prose-invert-hr': theme('colors.slate.600'),
            '--tw-prose-invert-quotes': theme('colors.slate.300'),
            '--tw-prose-invert-quote-borders': theme('colors.slate.600'),
            '--tw-prose-invert-captions': theme('colors.slate.300'),
            '--tw-prose-invert-code': theme('colors.slate.200'),
            '--tw-prose-invert-pre-code': theme('colors.slate.200'),
            '--tw-prose-invert-pre-bg': theme('colors.slate.900'),
            '--tw-prose-invert-th-borders': theme('colors.slate.600'),
            '--tw-prose-invert-td-borders': theme('colors.slate.600'),
            a: {
              color: theme('colors.primary.500'),
              '&:hover': {
                color: theme('colors.primary.600')
              }
            },
            table: {
              overflowX: 'auto'
            }
          }
        }
      }),
      height: {
        88: '22rem'
      }
    }
  },
  plugins: [forms, variables, typography]
}
