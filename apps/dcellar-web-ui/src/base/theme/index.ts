import { light } from './light';
import { Theme } from '@totejs/uikit';

export const theme: Theme = {
  colors: {
    light: { ...light.colors },
  },

  config: {
    useSystemColorMode: false, // true | false
    initialColorMode: 'light', // light | dark | system
  },

  styles: {
    global: {
      html: {
        lineHeight: 'normal',
      },
      body: {
        // todo refactor
        bg: 'bg.middle',
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
        '.ui-menu-list': {
          borderRadius: 4,
          boxShadow: '0px 4px 24px 0px rgba(0, 0, 0, 0.08)',
        },
        '.ui-menu-list .ui-menu-item': {
          padding: 8,
          lineHeight: 'normal',
          fontWeight: 400,
          _hover: {
            color: 'currentColor',
          },
        },
      },
    },
  },
};
