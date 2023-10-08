/// <reference types="redux-persist" />
import { BaseThemeTypings } from '@totejs/uikit';
import type { SwiperSlideProps, SwiperProps } from 'swiper/react';

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
      "swiper-container": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & SwiperProps,
        HTMLElement
      >;
      "swiper-slide": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & SwiperSlideProps,
        HTMLElement
      >;
    }
  }
}

declare module '*.svg' {
  const content: any;
  export default content;
}
