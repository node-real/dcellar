import { BaseThemeTypings } from '@totejs/uikit';

declare module '@totejs/uikit' {
  export interface CustomThemeTypings {
    colors:
      | BaseThemeTypings['colors']
      | 'readable.primary'
      | 'readable.tertiary'
      | 'readable.placeholder'
      | 'readable.neutral1'
      | 'readable.neutral2'
      | 'readable.neutral3'
      | 'readable.neutral4'
      | 'readable.neutral5'
      | 'readable.neutral6'
      | 'readable.brand5'
      | 'readable.brand6'
      | 'readable.brand7'
      | 'bg.secondary';
    shadows: BaseThemeTypings['shadows'];
  }
}

interface Window {
  web3: any;
  ethereum: any;
  ga: any;
  clipboardData: any;
  trustwallet: any;
}

declare module '*.svg' {
  const content: any;
  export default content;
}
