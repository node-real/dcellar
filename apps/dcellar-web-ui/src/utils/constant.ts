import { convertVisibility } from './object';

const getLoginLocalStorageKey = (prefix = '') => `${prefix}_GREENFIELD_LOGIN_STORAGE`;

const USER_REJECT_STATUS_NUM = 4001;
const REQUEST_PENDING_NUM = -32002;

const reverseVisibilityType = convertVisibility();

const CHAIN_NAMES: { [key: number | string]: string } = {
  5600: 'Greenfield Testnet',
  97: 'BNB Smart Chain Testnet',
  9000: 'Greenfield Devnet',
  1017: 'Greenfield Mainnet',
};

export {
  CHAIN_NAMES,
  getLoginLocalStorageKey,
  USER_REJECT_STATUS_NUM,
  REQUEST_PENDING_NUM,
  reverseVisibilityType,
};

export const G_BYTES = 1024 * 1024 * 1024;
