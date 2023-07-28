import { light } from './light';
import { dark } from './dark';

export const theme = {
  colors: {
    dark: {
      ...dark.colors,
    },
    light: {
      ...light.colors,
    },
  },
  config: {
    useSystemColorMode: false, // true | false
    initialColorMode: 'light', // light | dark | system
  },
  styles: {
    global: {
      body: {
        bg: 'transparent',
        '.ui-toast-manager': {
          top: 65,
          maxW: '500px',
        },
      },
    },
  },
};
