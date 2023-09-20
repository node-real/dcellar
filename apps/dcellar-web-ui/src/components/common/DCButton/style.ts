export const buttonConfig = {
  baseStyle: {
    button: {
      fontWeight: '500',
      transitionProperty: 'common',
      transitionDuration: 'normal',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none',
      lineHeight: 'normal',
      outline: 'none',
      gap: 8,
      _disabled: {
        cursor: 'not-allowed',
      },
    },
  },

  sizes: {
    sm: (props: any) => {
      return {
        button: {
          pl: props.leftIcon ? 4 : 8,
          pr: props.rightIcon ? 4 : 8,
          h: 24,
          minW: 24,
          borderRadius: 4,
          fontSize: '14px',
        },
        leftIcon: {
          mr: 0,
        },
        rightIcon: {
          ml: 0,
        },
      };
    },

    md: (props: any) => {
      const _px = props.leftIcon || props.rightIcon ? 8 : 16;
      const px = props.variant === 'ghost' ? _px - 2 : _px;
      return {
        button: {
          px,
          h: 40,
          minW: 40,
          borderRadius: 4,
          fontSize: '16px',
        },
      };
    },

    lg: (props: any) => {
      return {
        button: {
          pl: props.leftIcon ? 16 : 24,
          pr: props.rightIcon ? 16 : 24,
          h: 50,
          minW: 50,
          borderRadius: 8,
          fontSize: '16px',
        },
      };
    },
  },

  variants: {
    scene: (props: any) => {
      const { colorScheme: c } = props;

      return {
        button: {
          bg: `scene.${c}.normal`,
          color: 'readable.white',
          _hover: {
            bg: `scene.${c}.active`,
          },
          _disabled: {
            _hover: {
              bg: `scene.${c}.normal`,
            },
          },
        },
      };
    },

    // Primary
    brand: (props: any) => {
      return {
        button: {
          color: 'readable.white',
          bg: 'brand.brand6',
          _hover: {
            bg: 'brand.brand5',
          },
          _disabled: {
            bg: 'readable.disable',
            color: 'readable.tertiary',
            // _hover: {
            //   bg: 'readable.disable',
            // },
          },
        },
      };
    },

    // Secondary
    second: (props: any) => {
      return {
        button: {
          bg: 'readable.normal',
          color: 'readable.white',
          _hover: {
            bg: 'readable.secondary',
          },
          _disabled: {
            bg: 'readable.disable',
            color: 'readable.tertiary',
            // _hover: {
            //   bg: 'readable.disable',
            // },
          },
        },
      };
    },

    // Outline
    ghost: (props: any) => {
      return {
        button: {
          border: '1px solid',
          borderColor: 'readable.border',
          color: 'readable.normal',
          bg: 'bg.middle',
          _hover: {
            color: 'brand.brand6',
            borderColor: 'brand.brand6',
          },
          _disabled: {
            borderColor: 'readable.border',
            color: 'readable.disable',
            // _hover: {
            //   borderColor: 'readable.border',
            //   color: 'readable.disable',
            // },
          },
        },
      };
    },
  },
};
