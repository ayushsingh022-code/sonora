/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sonora Brand & Design Tokens
 * Source of truth matching the approved Sonora brand identity presentation board
 * and mobile app UI showcase.
 */

export const SONORA_TOKENS = {
  colors: {
    primary: '#FF5A36', // Primary Orange
    secondary: '#FF2D8B', // Pink
    highlight: '#D9F56A', // Lime Highlight
    tertiary: '#E9DFFF', // Lavender
    background: '#FAF7F2', // Warm Cream Background
    text: '#20201E', // Primary Dark Charcoal
    muted: '#B9B2A9', // Muted Warm Gray
    card: '#FFFFFF', // Clean Card Surface
    cardSubtle: '#F6F2EB', // Secondary Warm Surface
    border: '#EFE9DF', // Restrained Border
    borderStrong: '#E2DAD0',

    // Genre specific token backgrounds
    genres: {
      pop: { bg: '#FFEBE5', text: '#FF5A36', iconBg: '#FF5A36' },
      indie: { bg: '#D9F56A', text: '#20201E', iconBg: '#20201E' },
      rock: { bg: '#E9DFFF', text: '#5B418E', iconBg: '#5B418E' },
      hiphop: { bg: '#FFE4F1', text: '#FF2D8B', iconBg: '#FF2D8B' },
    },

    // Gradients
    gradients: {
      brand: 'linear-gradient(135deg, #FF5A36 0%, #FF2D8B 100%)',
      brandSubtle: 'linear-gradient(135deg, rgba(255, 90, 54, 0.12) 0%, rgba(255, 45, 139, 0.12) 100%)',
      darkOverlay: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 100%)',
    },
  },

  typography: {
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },

  radii: {
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem',   // 32px
    full: '9999px',  // Pill
  },

  shadows: {
    subtle: '0 2px 8px -2px rgba(32, 32, 30, 0.05)',
    card: '0 4px 20px -2px rgba(32, 32, 30, 0.06)',
    glow: '0 8px 24px -4px rgba(255, 90, 54, 0.3)',
    float: '0 12px 32px -4px rgba(32, 32, 30, 0.12)',
  },

  dimensions: {
    mobileMaxWidth: '480px',
    desktopSidebarWidth: '260px',
    bottomNavHeight: '74px',
    headerHeight: '64px',
  },
} as const;
