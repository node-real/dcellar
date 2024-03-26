import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';

export const GAS_FEE_DOC = 'https://docs.nodereal.io/docs/dcellar-faq#fee-related';
export const PREPAID_FEE_DOC = 'https://docs.nodereal.io/docs/dcellar-faq#fee-related';
export const SETTLEMENT_FEE_DOC = 'https://docs.nodereal.io/docs/dcellar-faq#fee-related';

// status_TITLE
const FILE_TITLE_UPLOADING = 'Uploading Object';
const FILE_TITLE_DOWNLOADING = 'Downloading Object';
const FILE_TITLE_DELETING = 'Deleting Object';
const FILE_TITLE_CANCELING = 'Canceling Uploading';
const FOLDER_CREATING = 'Creating Folder';
const FILE_ACCESS = 'Updating Access';
// error title
const FILE_TITLE_UPLOAD_FAILED = 'Upload Failed';
const FILE_TITLE_DOWNLOAD_FAILED = 'Download Failed';
const FILE_TITLE_DELETE_FAILED = 'Delete Failed';
const FILE_TITLE_CANCEL_FAILED = 'Cancel Failed';
const NOT_ENOUGH_QUOTA = 'Quota Insufficient';
const FOLDER_CREATE_FAILED = 'Create Failed';
const FOLDER_TITLE_NOT_EMPTY = 'Non-Empty Folder';

const FILE_TITLE_FILE_TOO_LARGE = 'Object Exceeds Size Limit';
const FILE_TITLE_FILE_EMPTY = 'Object is Empty';
const FILE_TITLE_FILE_NAME_ERROR = 'Invalid Object Name';
const FILE_TITLE_SP_REJECTED = 'SP Rejected';

// status description
const FILE_STATUS_DOWNLOADING = `Downloading Object now, please wait...`;
// error description
const FILE_DESCRIPTION_DELETE_ERROR = `Sorry, there’s something wrong when deleting the file.`;
const FILE_DESCRIPTION_CANCEL_ERROR = `Sorry, there’s something wrong when canceling the file.`;
const FOLDER_DESCRIPTION_CREATE_ERROR = `Sorry, there’s something wrong when creating the folder.`;
const BUTTON_GOT_IT = 'Got It';
const FOLDER_DESC_NOT_EMPTY =
  'Only empty folder can be deleted. Please delete all objects in this folder first.';

// file status
const OBJECT_SEALED_STATUS = 1;

const GET_GAS_FEE_LACK_BALANCE_ERROR = `Gas fee estimation error, please retry later.`;
const LOCK_FEE_LACK_BALANCE_ERROR = `Current available balance is not enough for prepaid fee, please check.`;
const DUPLICATE_OBJECT_NAME = 'This name is already taken, try another one.';
const UNKNOWN_ERROR = `Unknown error. Please try again later.`;
const AUTH_EXPIRED = 'Authentication Expired';
const WALLET_CONFIRM = 'Please confirm the transaction in your wallet.';

export const EMPTY_TX_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

export const MOCK_EMPTY_FOLDER_OBJECT: ObjectMeta = {
  ObjectInfo: {
    Owner: '0xDB8040c64d24840BD1D6BcAC7112D2A143CC2EEa',
    Creator: '0xDB8040c64d24840BD1D6BcAC7112D2A143CC2EEa',
    BucketName: '',
    ObjectName: '',
    Id: 0,
    LocalVirtualGroupId: 0,
    PayloadSize: 0,
    Visibility: 3,
    ContentType: 'text/plain',
    CreateAt: 1711002963,
    ObjectStatus: 1,
    RedundancyType: 0,
    SourceType: 0,
    Checksums: [
      'Xfbg4nYTWdMKgnUFjimfzAOBU0VF9Vz0PkGYP11MlFY=',
      'Xfbg4nYTWdMKgnUFjimfzAOBU0VF9Vz0PkGYP11MlFY=',
      'Xfbg4nYTWdMKgnUFjimfzAOBU0VF9Vz0PkGYP11MlFY=',
      'Xfbg4nYTWdMKgnUFjimfzAOBU0VF9Vz0PkGYP11MlFY=',
      'Xfbg4nYTWdMKgnUFjimfzAOBU0VF9Vz0PkGYP11MlFY=',
      'Xfbg4nYTWdMKgnUFjimfzAOBU0VF9Vz0PkGYP11MlFY=',
      'Xfbg4nYTWdMKgnUFjimfzAOBU0VF9Vz0PkGYP11MlFY=',
    ],
    Tags: {
      Tags: [],
    },
  },
  LockedBalance: '0x0000000000000000000000000000000000000000000000000000000000000000',
  Removed: false,
  UpdateAt: 3075455,
  DeleteAt: 0,
  DeleteReason: '',
  Operator: '0x0000000000000000000000000000000000000000',
  CreateTxHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  UpdateTxHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  SealTxHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
};

export {
  AUTH_EXPIRED,
  BUTTON_GOT_IT,
  DUPLICATE_OBJECT_NAME,
  FILE_ACCESS,
  FILE_DESCRIPTION_CANCEL_ERROR,
  FILE_DESCRIPTION_DELETE_ERROR,
  FILE_STATUS_DOWNLOADING,
  FILE_TITLE_CANCELING,
  FILE_TITLE_CANCEL_FAILED,
  FILE_TITLE_DELETE_FAILED,
  FILE_TITLE_DELETING,
  FILE_TITLE_DOWNLOADING,
  FILE_TITLE_DOWNLOAD_FAILED,
  FILE_TITLE_FILE_EMPTY,
  FILE_TITLE_FILE_NAME_ERROR,
  FILE_TITLE_FILE_TOO_LARGE,
  FILE_TITLE_SP_REJECTED,
  FILE_TITLE_UPLOADING,
  FILE_TITLE_UPLOAD_FAILED,
  FOLDER_CREATE_FAILED,
  FOLDER_CREATING,
  FOLDER_DESCRIPTION_CREATE_ERROR,
  FOLDER_DESC_NOT_EMPTY,
  FOLDER_TITLE_NOT_EMPTY,
  GET_GAS_FEE_LACK_BALANCE_ERROR,
  LOCK_FEE_LACK_BALANCE_ERROR,
  NOT_ENOUGH_QUOTA,
  OBJECT_SEALED_STATUS,
  UNKNOWN_ERROR,
  WALLET_CONFIRM,
};
