/// <reference types="redux-persist" />

import { BaseThemeTypings } from '@totejs/uikit';

declare module '@totejs/uikit' {
  export interface CustomThemeTypings {
    colors:
      | BaseThemeTypings['colors']
      | 'brand.normal.hight'
      | 'brand.normal'
      | 'brand.disable'
      | 'readable.normal'
      | 'readable.secondary'
      | 'readable.tertiary'
      | 'readable.disable'
      | 'readable.border'
      | 'readable.white'
      | 'bg.bottom'
      | 'bg.bottom.secondary'
      | 'bg.middle'
      | 'bg.top.normal'
      | 'bg.top.active'
      | 'readable.label.normal'
      | 'readable.label.active'
      | 'brand.brand1'
      | 'brand.brand2'
      | 'brand.brand3'
      | 'brand.brand4'
      | 'brand.brand5'
      | 'brand.brand6'
      | 'brand.brand7'
      | 'brand.brand8'
      | 'brand.brand9'
      | 'brand.brand10';
    shadows: BaseThemeTypings['shadows'];
  }
}

declare global {
  interface Window {
    web3: any;
    ethereum: any;
    ga: any;
    clipboardData: any;
    trustWallet: any;
    trustwallet: any;
    // zk.wasm export
    eddsaSign: any;
  }
}
