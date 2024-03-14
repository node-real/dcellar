/// <reference types="redux-persist" />
import { BaseThemeTypings } from '@node-real/uikit';
import type { SwiperProps, SwiperSlideProps } from 'swiper/react';

declare module '@node-real/uikit' {
  export interface CustomThemeTypings {
    colors:
      | BaseThemeTypings['colors']
      | 'brand.normal.hight'
      | 'brand.normal'
      | 'brand.disable'
      | 'readable.normal'
      | 'readable.primary'
      | 'readable.secondary'
      | 'readable.tertiary'
      | 'readable.disable'
      | 'readable.border'
      | 'readable.white'
      | 'bg.bottom'
      | 'bg.bottom.secondary'
      | 'bg.secondary'
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
      | 'brand.brand10'
      | 'opacity1'
      | 'opacity2'
      | 'opacity3'
      | 'opacity4'
      | 'opacity5'
      | 'opacity6'
      | 'opacity7'
      | 'opacity8'
      | 'opacity9'
      | 'opacity10'
      | 'opacity11';
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
  namespace JSX {
    interface IntrinsicElements {
      'swiper-container': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & SwiperProps,
        HTMLElement
      >;
      'swiper-slide': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & SwiperSlideProps,
        HTMLElement
      >;
    }
  }
}
