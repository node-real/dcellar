import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { GAClick } from '@/components/common/GATracker';
import { BatchOperations } from '@/modules/object/components/BatchOperations';
import { UploadMenuList } from '@/modules/object/components/UploadMenuList';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectAccount } from '@/store/slices/accounts';
import { setupBucketQuota } from '@/store/slices/bucket';
import { addToWaitQueue } from '@/store/slices/global';
import {
  ObjectEntity,
  SELECT_OBJECT_NUM_LIMIT,
  SINGLE_OBJECT_MAX_SIZE,
  selectObjectList,
  setObjectListRefreshing,
  setObjectOperation,
  setObjectListPageRestored,
  setObjectSelectedKeys,
  setupListObjects,
} from '@/store/slices/object';
import { getSpOffChainData } from '@/store/slices/persist';
import { formatBytes } from '@/utils/formatter';
import { getTimestamp } from '@/utils/time';
import { Flex, Menu, Tooltip, toast } from '@node-real/uikit';
import { debounce } from 'lodash-es';
import { ChangeEvent, memo, useCallback } from 'react';

export const MAX_FOLDER_LEVEL = 10;
export const MAX_FOLDER_NAME_LEN = 70;

interface NewObjectProps {
  showRefresh?: boolean;
  gaFolderClickName?: string;
  gaUploadClickName?: string;
  shareMode?: boolean;
}

export const CreateObject = memo<NewObjectProps>(function NewObject({
  showRefresh = false,
  gaFolderClickName = '',
  gaUploadClickName = '',
  shareMode = false,
}) {
  const dispatch = useAppDispatch();
  const isBucketDiscontinue = useAppSelector((root) => root.bucket.isBucketDiscontinue);
  const isBucketOwner = useAppSelector((root) => root.bucket.isBucketOwner);
  const pathSegments = useAppSelector((root) => root.object.pathSegments);
  const objectCommonPrefix = useAppSelector((root) => root.object.objectCommonPrefix);
  const completeCommonPrefix = useAppSelector((root) => root.object.completeCommonPrefix);
  const objectRecords = useAppSelector((root) => root.object.objectRecords);
  const currentBucketName = useAppSelector((root) => root.object.currentBucketName);
  const objectListRecords = useAppSelector((root) => root.object.objectListRecords);
  const bucketRecords = useAppSelector((root) => root.bucket.bucketRecords);
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const primarySpRecords = useAppSelector((root) => root.sp.primarySpRecords);
  const bucket = bucketRecords[currentBucketName];
  const accountDetail = useAppSelector(selectAccount(bucket?.PaymentAddress));
  const objectList = useAppSelector(selectObjectList);
  const primarySp = primarySpRecords[currentBucketName];

  const onOpenCreateFolder = () => {
    if (disabled) return;
    dispatch(setObjectOperation({ operation: ['', 'create_folder'] }));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refreshList = useCallback(
    debounce(async () => {
      const { seedString } = await dispatch(
        getSpOffChainData(loginAccount, primarySp.operatorAddress),
      );
      const query = new URLSearchParams();
      const params = {
        seedString,
        query,
        endpoint: primarySp.endpoint,
      };
      dispatch(setObjectSelectedKeys([]));
      dispatch(setupBucketQuota(currentBucketName));
      dispatch(setObjectListRefreshing(true));
      dispatch(setObjectListPageRestored(false));
      await dispatch(setupListObjects(params));
      dispatch(setObjectListRefreshing(false));
    }, 150),
    [loginAccount, primarySp?.operatorAddress, currentBucketName],
  );

  if (!isBucketOwner && !shareMode)
    return (
      <>
        {showRefresh && (
          <DCButton
            variant="ghost"
            onClick={refreshList}
            leftIcon={<IconFont type="refresh" w={24} />}
          />
        )}
      </>
    );

  const folderExist = !objectCommonPrefix || !!objectRecords[completeCommonPrefix + '/'];

  const invalidPath =
    pathSegments.some((name) => new Blob([name]).size > MAX_FOLDER_NAME_LEN) || !folderExist;
  const maxFolderDepth = invalidPath || pathSegments.length >= MAX_FOLDER_LEVEL;

  const loading = !objectListRecords[completeCommonPrefix];
  const disabled = maxFolderDepth || isBucketDiscontinue || loading || accountDetail.clientFrozen;
  const uploadDisabled =
    isBucketDiscontinue ||
    invalidPath ||
    pathSegments.length > MAX_FOLDER_LEVEL ||
    loading ||
    accountDetail.clientFrozen;

  const handleFilesChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    if (files.length > SELECT_OBJECT_NUM_LIMIT) {
      return toast.error({
        description: `You can only upload a maximum of ${SELECT_OBJECT_NUM_LIMIT} objects at a time.`,
        isClosable: true,
      });
    }
    Object.values(files).forEach((file: File) => {
      const time = getTimestamp();
      const id = parseInt(String(time * Math.random()));
      dispatch(addToWaitQueue({ id, file, time }));
    });
    dispatch(setObjectOperation({ operation: ['', 'upload'] }));
    e.target.value = '';
  };

  /**
   * 1. Validate if it is an empty folder.
   * 2. Validate if the root folder exists in the current directory.
   * 3. Validate the maximum folder depth less than 10.
   */
  const handlerFolderChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) {
      return toast.error({
        description: 'You can only upload folders that contain objects.',
        isClosable: true,
      });
    }
    if (files.length > SELECT_OBJECT_NUM_LIMIT) {
      e.target.value = '';
      return toast.error({
        description: `You can only upload a maximum of ${SELECT_OBJECT_NUM_LIMIT} objects at a time.`,
        isClosable: true,
      });
    }
    const relativeRootFolder = files[0].webkitRelativePath.split('/')[0];
    const isRootFolderNameToLong = relativeRootFolder.length > MAX_FOLDER_NAME_LEN;
    if (isRootFolderNameToLong) {
      return toast.error({
        description: `Folder name must not exceed ${MAX_FOLDER_NAME_LEN} characters.`,
        isClosable: true,
      });
    }
    const uploadFolderPath = [...pathSegments, relativeRootFolder].join('/') + '/';
    const isFolderExist = objectList.some(
      (object: ObjectEntity) => object.objectName === uploadFolderPath,
    );
    if (isFolderExist) {
      e.target.value = '';
      return toast.error({
        description: 'Folder already exists in the current path.',
        isClosable: true,
      });
    }
    // validate folder depth
    for (let i = 0; i < files.length; i++) {
      const webkitRelativePath = files[i].webkitRelativePath;
      const parts = webkitRelativePath.split('/');
      const folders = parts.slice(0, parts.length - 1);
      const depth =
        folders.length + objectCommonPrefix.split('/').filter((item) => !!item).length || 0;
      if (depth > 10) {
        e.target.value = '';
        return toast.error({
          description: `You have reached the maximum supported folder depth (${MAX_FOLDER_LEVEL}).`,
          isClosable: true,
        });
      }
    }

    const infos: { [key: string]: File } = {};
    Object.values(files).forEach((file: File) => {
      const folders = file.webkitRelativePath.split('/').slice(0, -1);
      let relativePath = '';
      folders.forEach((folder) => {
        relativePath += folder + '/';
        if (!infos[relativePath] && relativePath) {
          // folder object
          infos[relativePath] = new File([], relativePath, { type: 'text/plain' });
        }
      });
      // file object
      infos[file.webkitRelativePath] = file;
    });

    Object.values(infos).forEach((file: File) => {
      const time = getTimestamp();
      const id = parseInt(String(time * Math.random()));
      dispatch(addToWaitQueue({ id, file, time }));
    });
    dispatch(setObjectOperation({ operation: ['', 'upload'] }));
    e.target.value = '';
  };

  return (
    <Flex gap={12}>
      {showRefresh && (
        <>
          <DCButton
            variant="ghost"
            onClick={refreshList}
            leftIcon={<IconFont type="refresh" w={24} />}
          />
          <BatchOperations shareMode={shareMode} />
        </>
      )}
      {!shareMode && (
        <>
          <Tooltip
            content={
              invalidPath
                ? 'Folder does not exist.'
                : `You have reached the maximum supported folder depth (${MAX_FOLDER_LEVEL}).`
            }
            placement={'bottom-start'}
            visibility={maxFolderDepth && !loading ? 'visible' : 'hidden'}
          >
            <div>
              <GAClick name={gaFolderClickName}>
                <DCButton
                  whiteSpace="nowrap"
                  variant="second"
                  onClick={onOpenCreateFolder}
                  disabled={disabled}
                >
                  Create Folder
                </DCButton>
              </GAClick>
            </div>
          </Tooltip>
          <Menu matchWidth>
            <Tooltip
              placement="top-end"
              content={
                isBucketDiscontinue
                  ? 'Bucket in the discontinue status cannot upload objects.'
                  : accountDetail?.clientFrozen
                    ? 'The payment account in the frozen status cannot upload objects.'
                    : uploadDisabled
                      ? 'Path invalid'
                      : `Please limit object size to ${formatBytes(
                          SINGLE_OBJECT_MAX_SIZE,
                        )} and upload a maximum of ${SELECT_OBJECT_NUM_LIMIT} objects at a time.`
              }
            >
              <div>
                <UploadMenuList
                  gaUploadClickName={gaUploadClickName}
                  disabled={uploadDisabled}
                  handleFilesChange={handleFilesChange}
                  handlerFolderChange={handlerFolderChange}
                >
                  <IconFont type="upload" w={24} />
                  Upload
                  <Flex
                    className="ui-icon__container"
                    paddingX={'4px'}
                    height={'40px'}
                    borderRightRadius={4}
                    alignItems={'center'}
                    borderLeft={disabled ? '1px solid readable.border' : '1px solid #5ED47F'}
                  >
                    <IconFont
                      transform="rotate(-90deg)"
                      className="ui-icon"
                      type="back"
                      w={16}
                      mx={4}
                    />
                  </Flex>
                </UploadMenuList>
              </div>
            </Tooltip>
          </Menu>
        </>
      )}
    </Flex>
  );
});
