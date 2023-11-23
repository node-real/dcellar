import { convertVisibility } from './object';
import { assetPrefix } from '@/base/env';

export const getLoginLocalStorageKey = (prefix = '') => `${prefix}_GREENFIELD_LOGIN_STORAGE`;

export const USER_REJECT_STATUS_NUM = 4001;
export const REQUEST_PENDING_NUM = -32002;

export const reverseVisibilityType = convertVisibility();

export const CHAIN_NAMES: { [key: number | string]: string } = {
  56: 'BNB Smart Chain Mainnet',
  97: 'BNB Smart Chain Testnet',
  9000: 'BNB Greenfield Devnet',
  5600: 'BNB Greenfield Testnet',
  1017: 'BNB Greenfield Mainnet',
};

export const GNFD_TESTNET = 5600;

export const GNFD_MAINNET = 1017;

export const G_BYTES = 1024 * 1024 * 1024;

export const ADDRESS_RE = /^0x[a-z0-9]{40}$/i;

export const GROUP_ID = /^[1-9][0-9]{0,10}$/;

export const DISCONTINUED_BANNER_HEIGHT = 33;
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
  terms: '/terms',
  pricing_calculator: '/pricing-calculator',
  accounts: '/accounts',
};

export const LCP_IMAGES = [
  `${assetPrefix}/images/animate/access.png`,
  `${assetPrefix}/images/animate/delete.png`,
  `${assetPrefix}/images/animate/group.png`,
  `${assetPrefix}/images/animate/object.png`,
  `${assetPrefix}/images/animate/upload.png`,
];

export const EVENT_CROSS_TRANSFER_IN = 'greenfield.bridge.EventCrossTransferIn';

export const TX_TYPE_MAP: Record<string, string> = {
  [EVENT_CROSS_TRANSFER_IN]: 'Transfer In',
  'cosmos.gov.v1.MsgDeposit': 'Proposal Deposit',
};

export const OWNER_ACCOUNT_NAME = 'Owner Account';