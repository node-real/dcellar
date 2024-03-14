import { Theme } from '@node-real/uikit';
import { light } from './light';

export const theme: Theme = {
  colors: {
    light: { ...light.colors },
  },
  breakpoints: {
    md: '768px',
    lg: '1440px',
  },
  config: {
    useSystemColorMode: false, // true | false
    initialColorMode: 'light', // light | dark | system
  },

  styles: {
    global: {
      html: {
        lineHeight: 'normal',
        '&.overflow-hidden': {
          overflow: 'hidden',
        },
      },
      body: {
        '.cw-wallet-button': {
          borderRadius: 4,
        },
        '.cw-description': {
          color: 'readable.tertiary',
        },
        '.object-list-date-filter .ant-picker-range-arrow': {
          display: 'none !important',
        },
        '.object-list-date-filter .ant-picker-range-wrapper': {
          border: '1px solid readable.border',
          borderRadius: 4,
        },
        // todo refactor
        bg: 'bg.middle',
        '.ui-toast-manager': {
          top: 65,
          maxW: '500px',
        },
        '.ui-list-item > div': {
          minW: 0,
        },
        '.ui-toast': {
          borderRadius: 4,
        },
        '.ui-modal-content': {
          boxShadow: '0px 4px 24px 0px rgba(0, 0, 0, 0.08)',
          borderRadius: 4,
        },
        '.ui-modal-content .ui-modal-close-button': {
          color: '#76808F',
        },
        '.ui-drawer .ui-drawer-body': {
          marginTop: 24,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'readable.border',
            borderRadius: '6px',
          },
        },
        '.ui-modal-content .ui-modal-header': {
          lineHeight: 'normal',
        },
        '.ui-modal-desc': {
          fontSize: 16,
          color: 'readable.tertiary',
          marginBottom: 32,
          textAlign: 'center',
        },
        '.ui-drawer .ui-drawer-body, .ui-drawer .ui-drawer-footer': {
          width: 'calc(100% + 48px)',
          marginLeft: -24,
          padding: '0 24px',
        },
        '.ui-drawer .ui-drawer-footer': {
          borderTop: '1px solid readable.border',
          marginTop: 0,
          marginBottom: -16,
          padding: '16px 24px',
          boxShadow: '0px 4px 24px 0px rgba(0, 0, 0, 0.08)',
          gap: 8,
        },
        '.tab-header-fixed': {
          boxShadow: '0px 4px 24px 0px rgba(0, 0, 0, 0.08)',
        },
        '.ui-drawer-header': {
          lineHeight: 'normal',
        },
        '.ui-drawer-header .ui-drawer-sub': {
          lineHeight: 'normal',
          mt: 4,
          // mb: -8,
          fontWeight: 400,
          fontSize: 16,
          color: 'readable.tertiary',
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
        '.ui-input': {
          borderRadius: 4,
          fontWeight: 400,
          '&[disabled],&[disabled]:hover': {
            border: '1px solid readable.border',
            bg: 'bg.bottom',
            opacity: 1,
            color: 'readable.disable',
          },
        },
        '.ui-textarea': {
          borderRadius: 4,
          fontWeight: 400,
        },
      },
    },
  },
};
