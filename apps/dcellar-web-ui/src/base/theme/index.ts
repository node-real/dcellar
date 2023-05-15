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
        '.ui-toast-manager': {
          pt: ['66px', '65px'],
          maxW: '500px',
        },
        '.ui-toast-description': {
          wordBreak: 'break-word',
        },
      },
    },
  },
};
