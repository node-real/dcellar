import { assetPrefix } from '@/base/env';
//icon
const FILE_BOX_IMAGE_URL = `${assetPrefix}/images/files/file_box.svg`;
const FILE_TOO_LARGE_URL = `${assetPrefix}/images/files/file_too_large.svg`;
const FILE_FAILED_URL = `${assetPrefix}/images/files/file_failed.svg`;
const FILE_EMPTY_URL = `${assetPrefix}/images/files/file_empty.svg`;
const FILE_DELETE_GIF = `${assetPrefix}/images/icons/delete.gif`;
const PENDING_ICON_URL = `${assetPrefix}/images/icons/pending.gif`;
const COPY_SUCCESS_ICON = `${assetPrefix}/images/files/icon_success.svg`;
const FILE_UPLOAD_URL = `${assetPrefix}/images/files/file_upload.gif`;
const FILE_DOWNLOAD_URL = `${assetPrefix}/images/files/file_download.gif`;
const NOT_ENOUGH_QUOTA_URL = `${assetPrefix}/images/files/not_enough_quota.svg`;
const DELETE_ICON_URL = `${assetPrefix}/images/icons/delete.gif`;
const UPLOAD_IMAGE_URL = `${assetPrefix}/images/files/upload.svg`;
const FILE_INFO_IMAGE_URL = `/images/files/upload_file.svg`;

// status_TITLE
const FILE_TITLE_UPLOADING = 'Uploading File';
const FILE_TITLE_DOWNLOADING = 'Downloading File';
const FILE_TITLE_DELETING = 'Deleting File';
const FILE_TITLE_CANCELING = 'Canceling Uploading';
const FOLDER_CREATING = 'Creating Folder';
// error title
const FILE_TITLE_UPLOAD_FAILED = 'Upload Failed';
const FILE_TITLE_DOWNLOAD_FAILED = 'Download Failed';
const FILE_TITLE_DELETE_FAILED = 'Delete Failed';
const FILE_TITLE_CANCEL_FAILED = 'Cancel Failed';
const NOT_ENOUGH_QUOTA = 'Not Enough Quota';

const FILE_TITLE_FILE_TOO_LARGE = 'File is too large';
const FILE_TITLE_FILE_EMPTY = 'File is empty';
const FILE_TITLE_FILE_NAME_ERROR = 'File Name Error';
const FILE_TITLE_SP_REJECTED = 'SP Rejected';

// status description
const FILE_STATUS_UPLOADING = 'Please confirm the transaction in your wallet.';
const FILE_STATUS_DOWNLOADING = `Downloading file now, please wait...`;
const FILE_STATUS_CANCELING = `Please confirm the transaction in your wallet.`;
const FILE_STATUS_DELETING = `Please confirm the transaction in your wallet.`;
// error description
const FILE_DESCRIPTION_UPLOAD_ERROR = `Sorry, there’s something wrong when uploading the file.`;
const FILE_DESCRIPTION_DOWNLOAD_ERROR = `Sorry, there’s something wrong when downloading the file.`;
const FILE_DESCRIPTION_DELETE_ERROR = `Sorry, there’s something wrong when deleting the file.`;
const FILE_DESCRIPTION_CANCEL_ERROR = `Sorry, there’s something wrong when canceling the file.`;
const NOT_ENOUGH_QUOTA_ERROR = `Sorry, you don’t have enough download quota to download this file now.`;

const BUTTON_GOT_IT = 'Got It';
// file status
const OBJECT_SEALED_STATUS = 1;
const OBJECT_CREATE_STATUS = 0;
const OBJECT_STATUS_UPLOADING = 'OBJECT_STATUS_UPLOADING';
const OBJECT_STATUS_FAILED = 'OBJECT_STATUS_FAILED';
const FOLDER_STATUS_CREATING = 'FOLDER_STATUS_CREATING';

const GET_LOCK_FEE_ERROR = `Get lock fee error, please retry`;
const GET_GAS_FEE_ERROR = `Get gas fee error, please retry`;
const GET_GAS_FEE_LACK_BALANCE_ERROR = `Current available balance is not enough for gas simulation, please check.`;
const GET_GAS_FEE_DEFAULT_ERROR = `There are some errors occurred when estimating gas fee, please check.`;
const FETCH_OBJECT_APPROVAL_ERROR = `Fetch object approval error, please retry.`;
const UNKNOWN_ERROR = `Unknown error. Please try again later.`;
export {
  FILE_BOX_IMAGE_URL,
  FILE_TOO_LARGE_URL,
  FILE_FAILED_URL,
  FILE_EMPTY_URL,
  FILE_UPLOAD_URL,
  COPY_SUCCESS_ICON,
  FILE_DOWNLOAD_URL,
  FILE_TITLE_UPLOADING,
  FILE_TITLE_DOWNLOADING,
  FILE_TITLE_DELETING,
  FILE_TITLE_CANCELING,
  FILE_STATUS_UPLOADING,
  FILE_STATUS_DOWNLOADING,
  BUTTON_GOT_IT,
  FILE_TITLE_UPLOAD_FAILED,
  FILE_TITLE_DOWNLOAD_FAILED,
  FILE_TITLE_DELETE_FAILED,
  OBJECT_SEALED_STATUS,
  OBJECT_CREATE_STATUS,
  OBJECT_STATUS_UPLOADING,
  FILE_TITLE_CANCEL_FAILED,
  OBJECT_STATUS_FAILED,
  FILE_DESCRIPTION_UPLOAD_ERROR,
  FILE_DESCRIPTION_DELETE_ERROR,
  FILE_DESCRIPTION_CANCEL_ERROR,
  FILE_DESCRIPTION_DOWNLOAD_ERROR,
  FILE_STATUS_CANCELING,
  FILE_STATUS_DELETING,
  GET_LOCK_FEE_ERROR,
  GET_GAS_FEE_ERROR,
  GET_GAS_FEE_LACK_BALANCE_ERROR,
  GET_GAS_FEE_DEFAULT_ERROR,
  NOT_ENOUGH_QUOTA,
  NOT_ENOUGH_QUOTA_ERROR,
  NOT_ENOUGH_QUOTA_URL,
  FILE_TITLE_FILE_TOO_LARGE,
  FILE_TITLE_FILE_EMPTY,
  FILE_TITLE_FILE_NAME_ERROR,
  FILE_TITLE_SP_REJECTED,
  FILE_DELETE_GIF,
  PENDING_ICON_URL,
  DELETE_ICON_URL,
  UPLOAD_IMAGE_URL,
  FILE_INFO_IMAGE_URL,
  FOLDER_CREATING,
  FETCH_OBJECT_APPROVAL_ERROR,
  FOLDER_STATUS_CREATING,
  UNKNOWN_ERROR,
};
