import { assetPrefix } from '@/base/env';
import { convertVisibility } from '@/utils/object';

export const getLoginLocalStorageKey = (prefix = '') => `${prefix}_GREENFIELD_LOGIN_STORAGE`;

export const USER_REJECT_STATUS_NUM = 4001;

export const REQUEST_PENDING_NUM = -32002;

export const reverseVisibilityType = convertVisibility();

export const GNFD_TESTNET = 5600;

export const GNFD_MAINNET = 1017;

export const G_BYTES = 1024 * 1024 * 1024;

export const ADDRESS_RE = /^0x[a-z0-9]{40}$/i;

export const GROUP_ID = /^[1-9][0-9]{0,10}$/;

export const DISCONTINUED_BANNER_HEIGHT = 33;

export const DISCONTINUED_BANNER_MARGIN_BOTTOM = 16;

export const LCP_IMAGES = [
  `${assetPrefix}/images/animate/access.png`,
  `${assetPrefix}/images/animate/delete.png`,
  `${assetPrefix}/images/animate/group.png`,
  `${assetPrefix}/images/animate/object.png`,
  `${assetPrefix}/images/animate/upload.png`,
];
