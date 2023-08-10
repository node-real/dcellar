import { SINGLE_OBJECT_MAX_SIZE } from "@/store/slices/object";
import { FILE_EMPTY_URL, FILE_FAILED_URL, FILE_TITLE_DOWNLOAD_FAILED, FILE_TOO_LARGE_URL, NOT_ENOUGH_QUOTA_URL, UNKNOWN_ERROR_URL } from "../file/constant";
import { formatBytes } from "../file/utils";

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
    title: 'Object is too large',
    icon: FILE_TOO_LARGE_URL,
    desc: `Object size exceeded the maximum allowed size (${formatBytes(SINGLE_OBJECT_MAX_SIZE)}.`,
  },
  FILE_IS_EMPTY: {
    title: 'Object is empty',
    icon: FILE_EMPTY_URL,
    desc: 'Object size is zero, please check.',
  },
  OBJECT_TOO_LARGE: {
    title: 'Object is too large',
    icon: FILE_TOO_LARGE_URL,
    desc: `Object size exceeded the maximum allowed size (${formatBytes(SINGLE_OBJECT_MAX_SIZE)}).`,
  },
  OBJECT_NAME_EXISTS: {
    title: 'Object name already exists',
    icon: FILE_FAILED_URL
  },
  FOLDER_NAME_EXISTS: {
    title: 'Folder name already exists',
    icon: FILE_FAILED_URL,
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
  },
  SP_STORAGE_PRICE_FAILED: {
    title: 'Get storage price failed',
    icon: FILE_FAILED_URL,
    desc: 'Get storage price failed, please select another SP.',
  }
}

export type ObjectErrorType = keyof typeof OBJECT_ERROR_TYPES;
