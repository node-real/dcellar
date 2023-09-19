import { rgba } from '@totejs/uikit';

export const light = {
  colors: {
    brand: {
      'normal-hight': '#009e2c',
      normal: '#00ba34',
      disable: '#c2eece',
    },
    readable: {
      normal: '#1e2026',
      secondary: '#474d57',
      tertiary: '#76808f',
      disable: '#aeb4bc',
      border: '#e6e8ea',
      white: '#fff',
    },
    bg: {
      bottom: '#f5f5f5',
      'bottom-secondary': '#fafafa',
      middle: '#fff',
      top: {
        normal: '#f5f5f5',
        active: '#e6e8ea',
      },
    },
    scene: {
      success: {
        normal: '#00ba34',
        active: '#3ec659',
        opacity: {
          normal: rgba('#00ba34', 0.1),
          active: rgba('#00ba34', 0.15),
        },
      },
      danger: {
        normal: '#ee3911',
        active: '#f15d3c',
        opacity: {
          normal: rgba('#ee3911', 0.1),
          active: rgba('#ee3911', 0.15),
        },
      },
      waiting: {
        normal: '#eebe11',
        active: '#f1ca3c',
        opacity: {
          normal: rgba('#f0b90b', 0.1),
          active: rgba('#f0b90b', 0.15),
        },
      },
      warning: {
        normal: '#ee7c11',
        active: '#f1943c',
        opacity: {
          normal: rgba('#ee7c11', 0.1),
          active: rgba('#ee7c11', 0.15),
        },
      },
    },
    shadows: {
      normal: '0px 2px 8px rgba(11, 14, 17, 0.16)',
    },
  },
};
