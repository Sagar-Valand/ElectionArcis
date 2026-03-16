import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'system',
  useSystemColorMode: true,
};

const theme = extendTheme({
  config,
  fonts: {
    heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  },
  colors: {
    custom: {
      primary: '#C8D6E5',  // You can use this for backgrounds, borders, etc.
      darkModePrimary: '#54637A',  // You can use this for backgrounds, borders, etc.
      lightModeText: '#1A1A1A',
      darkModeText: '#FFFFFF',
      darModeBg: '#231F1F',
      // secondary: '#C8D6E5', // A lighter color for backgrounds or highlights
      accent: '#5F4BB6',    // A bold color for buttons or accents
      bottomNavText: '#65758B',
      selectedBottomNavText: '#1A1A1A',
      tabDarkMode: '#94A3B8',
      tabInactiveDarkBg: '#3F3F3F',
      tabInactiveLightBg: '#E1E1E2',
      secondaryTextColor: '#65758B',
      dashboardCardLight: '#EAEAEA',
      dashboardCardDark: '#2B2B2B'
    },
  },
});

export default theme;
