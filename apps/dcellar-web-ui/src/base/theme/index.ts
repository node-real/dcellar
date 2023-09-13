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
        '.ui-drawer .ui-drawer-body': {
          width: 'calc(100% + 48px)',
          marginLeft: -24,
          padding: '0 24px',
        },
        '.ui-drawer .ui-drawer-footer': {
          marginTop: 16,
        },
      },
    },
  },
};
