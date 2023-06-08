import { assetPrefix } from '@/base/env';

export const MEDIA_QUERY = {
  MIN_WIDTH_1440: '@media screen and (min-width: 1440px)',
  WIDTH_BETWEEN_1000_AND_1440: '@media screen and (min-width: 1000px) and (max-width: 1439px)',

  MIN_HEIGHT_600: '@media screen and (min-height: 600px)',
};

export const WELCOME_BG = `${assetPrefix}/images/welcome_bg.svg`;

export const BG_SIZE_STYLES = {
  bgSize: `1727px auto`,
  [MEDIA_QUERY.MIN_WIDTH_1440]: {
    bgSize: `2154px auto`,
  },
};
