import { toast } from '@node-real/uikit';
import { keyBy, toPairs, trimEnd } from 'lodash-es';
import {
  E_FILE_IS_EMPTY,
  E_FILE_TOO_LARGE,
  E_FOLDER_NAME_TOO_LONG,
  E_FULL_OBJECT_NAME_TOO_LONG,
  E_MAX_FOLDER_DEPTH,
  E_OBJECT_NAME_CONTAINS_SLASH,
  E_OBJECT_NAME_EMPTY,
  E_OBJECT_NAME_EXISTS,
  E_OBJECT_NAME_NOT_UTF8,
  E_OBJECT_NAME_TOO_LONG,
  E_UNKNOWN,
} from '@/facade/error';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '@/modules/object/ObjectError';
import { MAX_FOLDER_LEVEL } from '@/modules/object/components/CreateObject';
import { useAppDispatch, useAppSelector } from '@/store';
import { UPLOADING_STATUSES, WaitObject, setWaitQueue } from '@/store/slices/global';
import { SELECT_OBJECT_NUM_LIMIT, SINGLE_OBJECT_MAX_SIZE } from '@/store/slices/object';
import { isUTF8 } from '@/utils/coder';
import { TransferItemTree } from '@/utils/dom';
import { getTimestamp } from '@/utils/time';

export const useHandleFolderTree = () => {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const objectListRecords = useAppSelector((root) => root.object.objectListRecords);
  const currentBucketName = useAppSelector((root) => root.object.currentBucketName);
  const objectCommonPrefix = useAppSelector((root) => root.object.objectCommonPrefix);
  const completeCommonPrefix = useAppSelector((root) => root.object.completeCommonPrefix);
  const objectList = objectListRecords[completeCommonPrefix] || [];
  const objectWaitQueue = useAppSelector((root) => root.global.objectWaitQueue);
  const objectUploadQueue = useAppSelector((root) => root.global.objectUploadQueue);
  const objectListObjectNames = new Set(
    objectList.map((item) => currentBucketName + '/' + item.objectName),
  );
  const uploadingObjectNames = new Set(
    (objectUploadQueue?.[loginAccount] || [])
      .filter((item) => UPLOADING_STATUSES.includes(item.status))
      .map((item) => {
        return [
          item.bucketName,
          ...item.prefixFolders,
          item.waitObject.relativePath,
          item.waitObject.name,
        ]
          .filter((item) => !!item)
          .join('/');
      }),
  );

  const getErrorMsg = (type: string) => {
    return OBJECT_ERROR_TYPES[type as ObjectErrorType]
      ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
      : OBJECT_ERROR_TYPES[E_UNKNOWN];
  };

  const validateFolder = (relativePath: string, folder: File) => {
    if (!folder.name) {
      return E_FILE_IS_EMPTY;
    }
    const lastFolder = folder.name
      .split('/')
      .filter((item) => item !== '')
      .pop();
    if (lastFolder && lastFolder.length > 70) {
      return E_FOLDER_NAME_TOO_LONG;
    }

    const depth =
      trimEnd([objectCommonPrefix, relativePath, folder.name].join('/'), '/').split('/').length - 1;
    if (depth > MAX_FOLDER_LEVEL) {
      return E_MAX_FOLDER_DEPTH;
    }

    const fullObjectName = [completeCommonPrefix, relativePath, folder.name]
      .filter((item) => !!item)
      .join('/');
    const isExistObjectList = objectListObjectNames.has(fullObjectName);
    const isExistUploadList = uploadingObjectNames.has(fullObjectName);

    if (isExistObjectList || (!isExistObjectList && isExistUploadList)) {
      return E_OBJECT_NAME_EXISTS;
    }

    return '';
  };

  const validateFile = (relativePath: string, file: File) => {
    if (!file) {
      return E_FILE_IS_EMPTY;
    }
    if (file.size > SINGLE_OBJECT_MAX_SIZE) {
      return E_FILE_TOO_LARGE;
    }
    if (file.size <= 0) {
      return E_FILE_IS_EMPTY;
    }
    if (!file.name) {
      return E_OBJECT_NAME_EMPTY;
    }
    if (file.name.length > 256) {
      return E_OBJECT_NAME_TOO_LONG;
    }
    const fullPathObject = objectCommonPrefix + '/' + relativePath + '/' + file.name;
    if (fullPathObject.length > 1024) {
      return E_FULL_OBJECT_NAME_TOO_LONG;
    }
    if (!isUTF8(file.name)) {
      return E_OBJECT_NAME_NOT_UTF8;
    }
    if (file.name.includes('//')) {
      return E_OBJECT_NAME_CONTAINS_SLASH;
    }
    // Validation only works to data within the current path.
    const fullObjectName = [completeCommonPrefix, relativePath, file.name]
      .filter((item) => !!item)
      .join('/');
    const isExistObjectList = objectListObjectNames.has(fullObjectName);
    const isExistUploadList = uploadingObjectNames.has(fullObjectName);

    if (isExistObjectList || (!isExistObjectList && isExistUploadList)) {
      return E_OBJECT_NAME_EXISTS;
    }
    return '';
  };

  const handleFolderTree = (tree: TransferItemTree) => {
    const totalFiles = objectWaitQueue.length + Object.keys(tree).length;
    if (totalFiles > SELECT_OBJECT_NUM_LIMIT) {
      return toast.error({
        description: `You can only upload a maximum of ${SELECT_OBJECT_NUM_LIMIT} objects at a time.`,
        isClosable: true,
      });
    }
    if (totalFiles === objectWaitQueue.length) {
      return toast.error({
        description: 'You can only upload folders that contain objects.',
        isClosable: true,
      });
    }

    const newWaitQueue = toPairs(tree).map(([_relativePath, file]) => {
      const time = getTimestamp();
      const id = parseInt(String(time + time * Math.random()));

      const isFolder = file.name.endsWith('/');
      const parts = (_relativePath ? _relativePath : file.webkitRelativePath)?.split('/');
      const relativePath = isFolder
        ? ''
        : parts && parts.length > 1
          ? parts.slice(0, -1).join('/')
          : '';

      const errorType = isFolder
        ? validateFolder(relativePath, file)
        : validateFile(relativePath, file);
      const errorMsg = errorType ? getErrorMsg(errorType).title : '';

      const waitObject: WaitObject = {
        id,
        time,
        status: errorMsg ? 'ERROR' : 'WAIT',
        file: file,
        msg: errorMsg,
        name: file.name,
        type: file.type,
        size: file.size,
        relativePath: relativePath,
        lockFee: '',
      };

      return waitObject;
    });

    const finalWaitQueue = Object.values(
      keyBy([...objectWaitQueue, ...newWaitQueue], (item) => item.relativePath + '/' + item.name),
    );

    dispatch(setWaitQueue(finalWaitQueue));
  };

  return {
    handleFolderTree,
  };
};
