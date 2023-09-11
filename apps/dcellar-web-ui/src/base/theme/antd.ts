import { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#00BA34',
    colorBorderSecondary: '#e6e8ea',
    colorLink: '#00BA34',
    colorLinkActive: '#00BA34',
    colorLinkHover: '#00BA34',
    colorText: '#1E2026',
    colorTextHeading: '#76808F',
    fontFamily: 'Inter, sans-serif',
  },
  components: {
    Tooltip: {
      zIndexPopup: 1600,
    },
    InputNumber: {
      borderRadius: 2,
      boxShadow: 'none',
      colorBorder: '#E6E8EA',
      fontSize: 14,
      lineHeight: 1.214,
    },
  },
};
