import { ButtonProps } from '@totejs/uikit';

export const DCVariants = ['dcPrimary', 'dcWarning', 'dcDanger', 'dcGhost'] as const;
export type TDCVariant = (typeof DCVariants)[number];
export type TButtonConfig = {
  variants: {
    [key in TDCVariant]: ButtonProps;
  };
};
export const ButtonConfig: TButtonConfig = {
  variants: {
    dcWarning: {
      bg: `#EE7C11`,
      color: 'white',
      _hover: {
        bg: `#F1943C`,
      },
      _disabled: {
        bg: `#AEB4BC`,
        color: 'readable.tertiary',
        cursor: 'not-allowed',
        _hover: {
          bg: `#AEB4BC`,
        },
      },
    },
    dcPrimary: {
      bg: 'readable.brand6',
      color: 'white',
      _hover: {
        bg: 'readable.brand5',
      },
      _disabled: {
        bg: `#AEB4BC`,
        color: 'readable.tertiary',
        cursor: 'not-allowed',
        _hover: {
          bg: `#AEB4BC`,
        },
      },
    },
    dcDanger: {
      bg: '#EE3911',
      color: 'white',
      _hover: {
        bg: '#F15A2C',
      },
      _disabled: {
        bg: `#AEB4BC`,
        color: 'readable.tertiary',
        cursor: 'not-allowed',
        _hover: {
          bg: `#AEB4BC`,
        },
      },
    },
    dcGhost: {
      bg: 'white',
      color: 'readable.normal',
      border: '1px solid #1E2026',
      _hover: {
        color: 'white',
        bg: '#76808F',
        border: '1px solid transparent',
      },
      _disabled: {
        bg: `#AEB4BC`,
        color: 'readable.tertiary',
        border: '1px solid transparent',
        cursor: 'not-allowed',
        _hover: {
          bg: `#AEB4BC`,
          color: 'readable.tertiary'
        },
      },
    },
  },
};
