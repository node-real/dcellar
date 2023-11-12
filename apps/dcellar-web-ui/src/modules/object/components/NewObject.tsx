import React, { ChangeEvent, memo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { GAClick } from '@/components/common/GATracker';
import { Flex, Menu, MenuButton, MenuItem, MenuList, Text, toast, Tooltip } from '@totejs/uikit';
import {
  ObjectItem,
  SELECT_OBJECT_NUM_LIMIT,
  selectObjectList,
  setListRefreshing,
  setObjectOperation,
  setRestoreCurrent,
  setSelectedRowKeys,
  setupListObjects,
  SINGLE_OBJECT_MAX_SIZE,
} from '@/store/slices/object';
import { addToWaitQueue, resetWaitQueue } from '@/store/slices/global';
import { getSpOffChainData } from '@/store/slices/persist';
import { BatchOperations } from '@/modules/object/components/BatchOperations';
import { setupBucketQuota } from '@/store/slices/bucket';
import { debounce } from 'lodash-es';
import { getTimestamp } from '@/utils/time';
import { selectAccount } from '@/store/slices/accounts';
import { DCButton } from '@/components/common/DCButton';
import { IconFont } from '@/components/IconFont';
import { formatBytes } from '@/utils/formatter';

interface NewObjectProps {
  showRefresh?: boolean;
  gaFolderClickName?: string;
  gaUploadClickName?: string;
}

const MAX_FOLDER_LEVEL = 10;
const MAX_FOLDER_NAME_LEN = 70;

export const NewObject = memo<NewObjectProps>(function NewObject({
  showRefresh = false,
  gaFolderClickName = '',
  gaUploadClickName = '',
}) {
  const dispatch = useAppDispatch();
  const { discontinue, owner } = useAppSelector((root) => root.bucket);
  const { folders, prefix, path, objectsInfo, bucketName, objects } = useAppSelector(
    (root) => root.object,
  );
  const { bucketInfo } = useAppSelector((root) => root.bucket);
  const bucket = bucketInfo[bucketName];
  const accountDetail = useAppSelector(selectAccount(bucket?.PaymentAddress));
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { primarySpInfo } = useAppSelector((root) => root.sp);
  const primarySp = primarySpInfo[bucketName];
  const objectList = useAppSelector(selectObjectList);
  const onOpenCreateFolder = () => {
    if (disabled) return;
    dispatch(setObjectOperation({ operation: ['', 'create_folder'] }));
  };

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
      dispatch(setSelectedRowKeys([]));
      dispatch(setupBucketQuota(bucketName));
      dispatch(setListRefreshing(true));
      dispatch(setRestoreCurrent(false));
      await dispatch(setupListObjects(params));
      dispatch(setListRefreshing(false));
    }, 150),
    [loginAccount, primarySp?.operatorAddress, bucketName],
  );

  if (!owner)
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

  const folderExist = !prefix ? true : !!objectsInfo[path + '/'];

  const invalidPath =
    folders.some((name) => new Blob([name]).size > MAX_FOLDER_NAME_LEN) || !folderExist;
  const maxFolderDepth = invalidPath || folders.length >= MAX_FOLDER_LEVEL;

  const loading = !objects[path];
  const disabled = maxFolderDepth || discontinue || loading || accountDetail.clientFrozen;
  const uploadDisabled =
    discontinue ||
    invalidPath ||
    folders.length > MAX_FOLDER_LEVEL ||
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
    dispatch(resetWaitQueue());
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
    const uploadFolderPath = [...folders, relativeRootFolder].join('/') + '/';
    const isFolderExist = objectList.some(
      (object: ObjectItem) => object.objectName === uploadFolderPath,
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
      const depth = folders.length + prefix.split('/').filter((item) => !!item).length || 0;
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

    dispatch(resetWaitQueue());
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
          <BatchOperations />
        </>
      )}
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
{/* <<<<<<< HEAD
            <DCButton variant="second" onClick={onOpenCreateFolder} disabled={disabled}>
======= */}
            <DCButton
              whiteSpace="nowrap"
              variant="second"
              onClick={onOpenCreateFolder}
              // disabled={disabled}
              disabled={true}
            >
{/* >>>>>>> 358506c (fix(dcellar-web-ui): temp add notify) */}
              Create Folder
            </DCButton>
          </GAClick>
        </div>
      </Tooltip>
      <Menu matchWidth>
        <Tooltip
          placement="top-end"
          content={
            discontinue
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
            <MenuButton
              as={DCButton}
              position="relative"
              paddingRight={'0'}
              // disabled={uploadDisabled}
              disabled={true}
              _expanded={{
                '.ui-icon': {
                  transform: 'rotate(-270deg)',
                },
                '.ui-icon__container': {
                  bgColor: '#009E2C',
                },
              }}
            >
              <IconFont type="upload" w={24} />
              Upload
              <Flex
                className="ui-icon__container"
                paddingX={'4px'}
                height={'40px'}
                borderRightRadius={4}
                alignItems={'center'}
                // borderLeft={uploadDisabled ? '1px solid readable.border' : '1px solid #5ED47F'}
                borderLeft={'1px solid readable.border'}
              >
                <IconFont
                  transform="rotate(-90deg)"
                  className="ui-icon"
                  type="back"
                  w={16}
                  mx={4}
                />
              </Flex>
            </MenuButton>
          </div>
        </Tooltip>
        {!uploadDisabled && (
          <MenuList>
            <label htmlFor="files-upload">
              <GAClick name={gaUploadClickName}>
                <MenuItem
                  _hover={{
                    color: 'brand.brand7',
                    backgroundColor: 'rgba(0, 186, 52, 0.10)',
                  }}
                >
                  <Flex cursor="pointer">
                    <Text fontSize="14px" lineHeight="20px">
                      Upload Object(s)
                    </Text>
                  </Flex>
                  <input
                    type="file"
                    id="files-upload"
                    multiple
                    onChange={handleFilesChange}
                    style={{
                      visibility: 'hidden',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />
                </MenuItem>
              </GAClick>
            </label>
            <label htmlFor="folder-picker">
              <GAClick name={gaUploadClickName}>
                <MenuItem
                  _hover={{
                    color: 'brand.brand7',
                    backgroundColor: 'rgba(0, 186, 52, 0.10)',
                  }}
                  isDisabled={disabled}
                >
                  <Flex cursor="pointer">
                    <Text fontSize="14px" lineHeight="20px">
                      Upload Folder
                    </Text>
                  </Flex>
                  <input
                    type="file"
                    id="folder-picker"
                    name="folder-upload"
                    // @ts-ignore
                    webkitdirectory="true"
                    directory="true"
                    multiple
                    onChange={handlerFolderChange}
                    style={{
                      visibility: 'hidden',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />
                </MenuItem>
              </GAClick>
            </label>
          </MenuList>
        )}
      </Menu>
    </Flex>
  );
});
