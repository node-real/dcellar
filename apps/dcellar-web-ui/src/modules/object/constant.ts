export const GAS_FEE_DOC = 'https://docs.nodereal.io/docs/dcellar-faq#fee-related';
export const PREPAID_FEE_DOC = 'https://docs.nodereal.io/docs/dcellar-faq#fee-related';
export const SETTLEMENT_FEE_DOC = 'https://docs.nodereal.io/docs/dcellar-faq#fee-related';

// status_TITLE
const FILE_TITLE_UPLOADING = 'Uploading File';
const FILE_TITLE_DOWNLOADING = 'Downloading File';
const FILE_TITLE_DELETING = 'Deleting File';
const FILE_TITLE_CANCELING = 'Canceling Uploading';
const FOLDER_CREATING = 'Creating Folder';
const FILE_ACCESS = 'Updating Access';
// error title
const FILE_TITLE_UPLOAD_FAILED = 'Upload Failed';
const FILE_TITLE_DOWNLOAD_FAILED = 'Download Failed';
const FILE_TITLE_DELETE_FAILED = 'Delete Failed';
const FILE_TITLE_CANCEL_FAILED = 'Cancel Failed';
const NOT_ENOUGH_QUOTA = 'Not Enough Quota';
const FOLDER_CREATE_FAILED = 'Create Failed';
const FOLDER_TITLE_NOT_EMPTY = 'Folder not Empty';

const FILE_TITLE_FILE_TOO_LARGE = 'File is too large';
const FILE_TITLE_FILE_EMPTY = 'File is empty';
const FILE_TITLE_FILE_NAME_ERROR = 'File Name Error';
const FILE_TITLE_SP_REJECTED = 'SP Rejected';

// status description
const FILE_STATUS_DOWNLOADING = `Downloading file now, please wait...`;
// error description
const FILE_DESCRIPTION_DELETE_ERROR = `Sorry, there’s something wrong when deleting the file.`;
const FILE_DESCRIPTION_CANCEL_ERROR = `Sorry, there’s something wrong when canceling the file.`;
const FOLDER_DESCRIPTION_CREATE_ERROR = `Sorry, there’s something wrong when creating the folder.`;
const BUTTON_GOT_IT = 'Got It';
const FOLDER_DESC_NOT_EMPTY =
  'Only empty folder can be deleted. Please delete all objects in this folder first.';

// file status
const OBJECT_SEALED_STATUS = 1;

const GET_GAS_FEE_LACK_BALANCE_ERROR = `Current available balance is not enough for gas simulation, please check.`;
const LOCK_FEE_LACK_BALANCE_ERROR = `Current available balance is not enough for prepaid fee, please check.`;
const DUPLICATE_OBJECT_NAME = 'This name is already taken, try another one.';
const UNKNOWN_ERROR = `Unknown error. Please try again later.`;
const AUTH_EXPIRED = 'Authentication Expired';
const WALLET_CONFIRM = 'Confirm this transaction in your wallet.';

export const EMPTY_TX_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';
export {
  FILE_TITLE_UPLOADING,
  FILE_TITLE_DOWNLOADING,
  FILE_TITLE_DELETING,
  FILE_TITLE_CANCELING,
  FILE_STATUS_DOWNLOADING,
  BUTTON_GOT_IT,
  FILE_TITLE_UPLOAD_FAILED,
  FILE_TITLE_DOWNLOAD_FAILED,
  FILE_TITLE_DELETE_FAILED,
  OBJECT_SEALED_STATUS,
  FILE_TITLE_CANCEL_FAILED,
  FILE_DESCRIPTION_DELETE_ERROR,
  FILE_DESCRIPTION_CANCEL_ERROR,
  GET_GAS_FEE_LACK_BALANCE_ERROR,
  NOT_ENOUGH_QUOTA,
  FILE_TITLE_FILE_TOO_LARGE,
  FILE_TITLE_FILE_EMPTY,
  FILE_TITLE_FILE_NAME_ERROR,
  FILE_TITLE_SP_REJECTED,
  FOLDER_CREATING,
  FOLDER_CREATE_FAILED,
  FOLDER_DESCRIPTION_CREATE_ERROR,
  UNKNOWN_ERROR,
  DUPLICATE_OBJECT_NAME,
  AUTH_EXPIRED,
  FILE_ACCESS,
  FOLDER_TITLE_NOT_EMPTY,
  FOLDER_DESC_NOT_EMPTY,
  WALLET_CONFIRM,
  LOCK_FEE_LACK_BALANCE_ERROR,
};
