import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Color mode configuration
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

// Custom colors
const colors = {
  brand: {
    50: '#E6F6FF',
    100: '#BAE3FF',
    200: '#7CC4FA',
    300: '#47A3F3',
    400: '#2186EB',
    500: '#0967D2',
    600: '#0552B5',
    700: '#03449E',
    800: '#01337D',
    900: '#002159',
  },
  cognispeech: {
    primary: '#3182CE',
    secondary: '#38A169',
    accent: '#ED8936',
    warning: '#E53E3E',
    info: '#3182CE',
    success: '#38A169',
    error: '#E53E3E',
    background: {
      light: '#FFFFFF',
      dark: '#1A202C',
    },
    surface: {
      light: '#F7FAFC',
      dark: '#2D3748',
    },
    text: {
      primary: {
        light: '#1A202C',
        dark: '#F7FAFC',
      },
      secondary: {
        light: '#4A5568',
        dark: '#A0AEC0',
      },
    },
  },
};

// Custom fonts
const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  mono: `'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace`,
};

// Custom font sizes
const fontSizes = {
  '2xs': '0.625rem',
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
  '7xl': '4.5rem',
  '8xl': '6rem',
  '9xl': '8rem',
};

// Custom font weights
const fontWeights = {
  hairline: 100,
  thin: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

// Custom line heights
const lineHeights = {
  normal: 'normal',
  none: 1,
  shorter: 1.25,
  short: 1.375,
  base: 1.5,
  tall: 1.625,
  taller: '2',
  '3': '.75rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '7': '1.75rem',
  '8': '2rem',
  '9': '2.25rem',
  '10': '2.5rem',
};

// Custom letter spacing
const letterSpacings = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
};

// Custom space scale
const space = {
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
};

// Custom breakpoints
const breakpoints = {
  sm: '30em',
  md: '48em',
  lg: '62em',
  xl: '80em',
  '2xl': '96em',
};

// Custom border radius
const radii = {
  none: '0',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

// Custom shadows
const shadows = {
  xs: '0 0 0 1px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  outline: '0 0 0 3px rgba(66, 153, 225, 0.6)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
};

// Custom z-index values
const zIndices = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Custom component styles
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'lg',
    },
    sizes: {
      lg: {
        h: '50px',
        fontSize: 'md',
        px: 8,
      },
    },
    variants: {
      solid: {
        _hover: {
          transform: 'translateY(-1px)',
          boxShadow: 'lg',
        },
        transition: 'all 0.2s',
      },
    },
  },
  Input: {
    baseStyle: {
      field: {
        borderRadius: 'lg',
      },
    },
    sizes: {
      lg: {
        field: {
          h: '50px',
          fontSize: 'md',
        },
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'xl',
        border: '1px solid',
        borderColor: 'inherit',
      },
    },
  },
  Modal: {
    baseStyle: {
      dialog: {
        borderRadius: 'xl',
      },
    },
  },
  Alert: {
    baseStyle: {
      container: {
        borderRadius: 'lg',
      },
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: 'full',
    },
  },
  Progress: {
    baseStyle: {
      track: {
        borderRadius: 'full',
      },
      filledTrack: {
        borderRadius: 'full',
      },
    },
  },
};

// Custom semantic tokens
const semanticTokens = {
  colors: {
    'chakra-body-text': { _light: 'gray.800', _dark: 'white' },
    'chakra-body-bg': { _light: 'white', _dark: 'gray.800' },
    'chakra-subtle-bg': { _light: 'gray.50', _dark: 'gray.700' },
    'chakra-subtle-text': { _light: 'gray.600', _dark: 'gray.400' },
    'chakra-placeholder-color': { _light: 'gray.400', _dark: 'gray.500' },
    'chakra-border-color': { _light: 'gray.200', _dark: 'gray.600' },
    'chakra-container-bg': { _light: 'gray.50', _dark: 'gray.900' },
  },
};

// Extend the theme
const theme = extendTheme({
  config,
  colors,
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  space,
  breakpoints,
  radii,
  shadows,
  zIndices,
  components,
  semanticTokens,
});

export { theme };
