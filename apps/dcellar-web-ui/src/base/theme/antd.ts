import { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#00BA34',
    colorBorderSecondary: '#e6e8ea',
    colorLink: '#00BA34',
    colorLinkActive: '#00BA34',
    colorLinkHover: '#00BA34',
    colorText: '#1E2026',
    colorTextHeading: '#76808F',
    fontFamily: 'Inter, sans-serif',
    colorError: '#EE3911',
    colorErrorBorderHover: '#FC6E75',
    borderRadius: 4,
    boxShadowSecondary: '0px 4px 24px 0px rgba(0, 0, 0, 0.08)',
    boxShadowTertiary: '',
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
    DatePicker: {
      borderRadiusSM: 2,
      cellActiveWithRangeBg: '#E5F8EB',
      cellHoverWithRangeBg: '#CEF2D9',
      cellRangeBorderColor: '#E6E8EA',
    },
  },
};
