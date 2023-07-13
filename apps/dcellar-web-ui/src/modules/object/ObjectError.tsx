import { FILE_EMPTY_URL, FILE_FAILED_URL, FILE_TITLE_DOWNLOAD_FAILED, FILE_TOO_LARGE_URL, NOT_ENOUGH_QUOTA_URL, UNKNOWN_ERROR_URL } from "../file/constant";

export const OBJECT_ERROR_TYPES = {
  NO_QUOTA: {
    title: 'No Enough Quota',
    desc: 'This bucket where this file is stored don’t have enough download quota, contact the file owner to increase the download quota.',
    icon: NOT_ENOUGH_QUOTA_URL,
  },
  GET_QUOTA_FAILED: {
    title: 'Get Quota Failed',
    desc: 'Get quota failed, please retry.',
    icon: UNKNOWN_ERROR_URL,
  },
  PERMISSION_DENIED: {
    title: 'You Need Access',
    desc: 'You don’t have permission to download. You can ask the person who shared the link to invite you directly.',
    icon: FILE_FAILED_URL,
  },
  UNKNOWN: {
    title: 'Something Wrong',
    desc: 'Oops, there’s something wrong. ',
    icon: UNKNOWN_ERROR_URL,
  },
  FILE_TOO_LARGE_URL: {
    title: 'File is too large',
    icon: FILE_TOO_LARGE_URL,
    desc: 'File size exceeded the maximum allowed size (256MB).',
  },
  FILE_IS_EMPTY: {
    title: 'File is empty',
    icon: FILE_EMPTY_URL,
    desc: 'File size is zero, please check.',
  },
  OBJECT_TOO_LARGE: {
    title: 'Object is too large',
    icon: FILE_TOO_LARGE_URL,
    desc: 'Object size exceeded the maximum allowed size (256MB).',
  },
  OBJECT_NAME_EXISTS: {
    title: 'Object name already exists',
    icon: FILE_FAILED_URL
  },
  ACCOUNT_BALANCE_NOT_ENOUGH: {
    title: 'Account balance is not enough',
    icon: FILE_FAILED_URL,
    desc: 'Account balance is not enough, please recharge.',
  },
  NO_PERMISSION: {
    title: 'You need Access',
    icon: FILE_FAILED_URL,
    desc: "You don't have permission to download. You can ask the person who shared the link to invite you directly.",
  }
}

export type ObjectErrorType = keyof typeof OBJECT_ERROR_TYPES;
