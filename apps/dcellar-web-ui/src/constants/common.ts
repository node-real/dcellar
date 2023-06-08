export const DISCONTINUED_BANNER_HEIGHT = 44;
export const DISCONTINUED_BANNER_MARGIN_BOTTOM = 16;
// NOTICE: Because sp only get once approval in 10 blocks. So we cache the result under 25s.
export const GET_APPROVAL_INTERVAL = 20 * 1000;

export const MEDIA_QUERY = {
  MIN_WIDTH_1440: '@media screen and (min-width: 1440px)',
  WIDTH_BETWEEN_1000_AND_1440: '@media screen and (min-width: 1000px) and (max-width: 1439px)',

  MIN_HEIGHT_800: '@media screen and (min-height: 800px)',
  HEIGHT_BETWEEN_600_AND_800: '@media screen and (min-height: 600px) and (max-height: 799px)',
};

export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
};
