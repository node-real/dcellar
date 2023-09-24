import { convertVisibility } from './object';

export const getLoginLocalStorageKey = (prefix = '') => `${prefix}_GREENFIELD_LOGIN_STORAGE`;

export const USER_REJECT_STATUS_NUM = 4001;
export const REQUEST_PENDING_NUM = -32002;

export const reverseVisibilityType = convertVisibility();

export const G_BYTES = 1024 * 1024 * 1024;

export const ADDRESS_RE = /^0x[a-z0-9]{40}$/i;

export const GROUP_ID = /^[1-9][0-9]{0,10}$/;

export const DISCONTINUED_BANNER_HEIGHT = 44;
export const DISCONTINUED_BANNER_MARGIN_BOTTOM = 16;

export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
};

export const noderealUrl = 'https://nodereal.io';

export const METAMASK_DOWNLOAD_URL = 'https://metamask.io/download/';
export const TRUST_WALLET_DOWNLOAD_URL = 'https://trustwallet.com/browser-extension';
export const DcellarDoc = 'https://docs.nodereal.io/docs/dcellar-get-started';
export const FAQ = 'https://docs.nodereal.io/docs/dcellar-faq';

export const InternalRoutePaths = {
  wallet: '/wallet',
  transfer_in: '/wallet?type=transfer_in',
  transfer_out: '/wallet?type=transfer_out',
  send: '/wallet?type=send',
  buckets: '/buckets',
};
