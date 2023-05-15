const getLoginLocalStorageKey = (prefix = '') => `${prefix}_GREENFIELD_LOGIN_STORAGE`;

const USER_REJECT_STATUS_NUM = 4001;
const REQUEST_PENDING_NUM = -32002;
export { getLoginLocalStorageKey, USER_REJECT_STATUS_NUM, REQUEST_PENDING_NUM };
