import { CustomTheme } from '@totejs/walletkit/dist/themes/base';

export const customTheme: CustomTheme = {
  colors: {
    text: '#1E2026',
    textSecondary: '#76808F',
    primary: '#00ba34',
    primaryActive: '#3ec659',
    error: '#ee3911',
    errorActive: '#f15d3c',
    border: '#E6E8EA',
    disabled: '#AEB4BC',

    modalBackground: '#FFFFFF',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',

    buttonText: 'var(--wk-colors-text)',
    buttonTextHover: 'var(--wk-colors-text)',
    buttonBackground: '#f5f5f5',
    buttonBackgroundHover: 'rgba(0, 186, 52, 0.10)',

    connectButtonText: 'var(--wk-colors-text)',
    connectButtonTextHover: 'var(--wk-colors-text)',
    connectButtonBackground: '#f5f5f5',
    connectButtonBackgroundHover: '#e6e8ea',

    navButtonText: 'var(--wk-colors-textSecondary)',
    navButtonBackgroundHover: 'var(--wk-colors-border)',

    disconnectButtonBackgroundText: 'var(--wk-colors-text)',
    disconnectButtonBackgroundTextHover: 'var(--wk-colors-text)',
    disconnectButtonBackground: 'transparent',
    disconnectButtonBackgroundHover: 'var(--wk-colors-border)',
    disconnectButtonBorder: 'var(--wk-colors-border)',
    disconnectButtonBorderHover: 'var(--wk-colors-border)',

    optionText: 'var(--wk-colors-text)',
    optionTextHover: 'var(--wk-colors-text)',
    optionBackground: '#f5f5f5',
    optionBackgroundHover: 'rgba(0, 186, 52, 0.10)',

    walletOptionText: 'var(--wk-colors-optionText)',
    walletOptionTextHover: 'var(--wk-colors-optionTextHover)',
    walletOptionBackground: 'var(--wk-colors-optionBackground)',
    walletOptionBackgroundHover: 'var(--wk-colors-optionBackgroundHover)',

    chainOptionText: 'var(--wk-colors-optionText)',
    chainOptionTextHover: 'var(--wk-colors-optionTextHover)',
    chainOptionBackground: 'var(--wk-colors-optionBackground)',
    chainOptionBackgroundHover: 'var(--wk-colors-optionBackgroundHover)',

    toastBackground: 'var(--wk-colors-modalBackground)',

    qrCodeDot: 'var(--wk-colors-text)',
    qrCodeBorder: 'var(--wk-colors-border)',
  },
  shadows: {
    toast: '0px 4px 24px rgba(0, 0, 0, 0.08)',
  },
  radii: {
    common: '4px',
    modal: '4px',

    navButton: '4px',
    button: 'var(--wk-radii-common)',
    connectButton: 'var(--wk-radii-common)',
    disconnectButton: 'var(--wk-radii-common)',
    walletOption: 'var(--wk-radii-common)',
    walletOptionIcon: 'var(--wk-radii-common)',
    chainOption: 'var(--wk-radii-common)',
    toast: 'var(--wk-radii-common)',
    qrCode: 'var(--wk-radii-common)',
  },
};
