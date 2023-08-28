import { convertVisibility } from './object';

const getLoginLocalStorageKey = (prefix = '') => `${prefix}_GREENFIELD_LOGIN_STORAGE`;

const USER_REJECT_STATUS_NUM = 4001;
const REQUEST_PENDING_NUM = -32002;

const reverseVisibilityType = convertVisibility();

export {
  getLoginLocalStorageKey,
  USER_REJECT_STATUS_NUM,
  REQUEST_PENDING_NUM,
  reverseVisibilityType,
};

export const G_BYTES = 1024 * 1024 * 1024;
