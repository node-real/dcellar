import { MAX_FOLDER_LEVEL } from '@/modules/object/components/NewObject';
import { SINGLE_OBJECT_MAX_SIZE } from '@/store/slices/object';
import { formatBytes } from '@/utils/formatter';

export const OBJECT_ERROR_TYPES = {
  NO_QUOTA: {
    title: 'No Enough Quota',
    desc: 'This bucket where this file is stored don’t have enough download quota, contact the file owner to increase the download quota.',
    icon: 'empty-quota',
  },
  GET_QUOTA_FAILED: {
    title: 'Get Quota Failed',
    desc: 'Get quota failed, please retry.',
    icon: 'discontinue',
  },
  PERMISSION_DENIED: {
    title: 'You Need Access',
    desc: 'You don’t have permission to download. You can ask the person who shared the link to invite you directly.',
    icon: 'status-failed',
  },
  UNKNOWN: {
    title: 'Something Wrong',
    desc: 'Oops, there’s something wrong. ',
    icon: 'discontinue',
  },
  FILE_TOO_LARGE_URL: {
    title: 'Object is too large',
    icon: 'too-large',
    desc: `Object size exceeded the maximum allowed size (${formatBytes(SINGLE_OBJECT_MAX_SIZE)}.`,
  },
  FILE_IS_EMPTY: {
    title: 'Object is empty',
    icon: 'empty-upload',
    desc: 'Object size is zero, please check.',
  },
  OBJECT_TOO_LARGE: {
    title: 'Object is too large',
    icon: 'too-large',
    desc: `Object size exceeded the maximum allowed size (${formatBytes(SINGLE_OBJECT_MAX_SIZE)}).`,
  },
  OBJECT_NAME_EXISTS: {
    title: 'Object name already exists',
    icon: 'status-failed',
  },
  FOLDER_NAME_EXISTS: {
    title: 'Folder name already exists',
    icon: 'status-failed',
  },
  ACCOUNT_BALANCE_NOT_ENOUGH: {
    title: 'Account balance is not enough',
    icon: 'status-failed',
    desc: 'Account balance is not enough, please recharge.',
  },
  NO_PERMISSION: {
    title: 'You need Access',
    icon: 'status-failed',
    desc: "You don't have permission to download. You can ask the person who shared the link to invite you directly.",
  },
  SP_STORAGE_PRICE_FAILED: {
    title: 'Get storage price failed',
    icon: 'status-failed',
    desc: 'Get storage price failed, please select another SP.',
  },
  FOLDER_NAME_TOO_LONG: {
    title: 'The folder name must be between 1 and 70 characters long.',
    icon: 'status-failed',
    desc: 'The folder name must be between 1 and 70 characters long.',
  },
  OBJECT_NAME_TOO_LONG: {
    title: 'The object name must be between 1 and 256 characters long.',
    icon: 'status-failed',
    desc: 'The object name must be between 1 and 256 characters long.',
  },
  FULL_OBJECT_NAME_TOO_LONG: {
    title: 'The full object name must be between 1 and 1024 characters long.',
    icon: 'status-failed',
    desc: 'The full object name must be between 1 and 1024 characters long.',
  },
  BUCKET_NOT_EMPTY: {
    title: 'Bucket not Empty',
    desc: 'Only empty bucket can be deleted. Please delete all objects in this bucket first.',
    icon: 'empty-bucket',
  },
  MAX_FOLDER_DEPTH: {
    icon: 'status-failed',
    desc: `You have reached the maximum supported folder depth (${MAX_FOLDER_LEVEL}).`,
    title: `You have reached the maximum supported folder depth (${MAX_FOLDER_LEVEL}).`,
  },
};

export type ObjectErrorType = keyof typeof OBJECT_ERROR_TYPES;
