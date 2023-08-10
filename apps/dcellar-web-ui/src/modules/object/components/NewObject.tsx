import React, { ChangeEvent, memo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { GAClick } from '@/components/common/GATracker';
import {
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
  toast,
} from '@totejs/uikit';
import UploadIcon from '@/public/images/files/upload_transparency.svg';
import {
  ObjectItem,
  SELECT_OBJECT_NUM_LIMIT,
  selectObjectList,
  setEditCreate,
  setEditUploadStatus,
  setListRefreshing,
  setRestoreCurrent,
  setSelectedRowKeys,
  setupListObjects,
} from '@/store/slices/object';
import { addToWaitQueue } from '@/store/slices/global';
import { getUtcZeroTimestamp } from '@bnb-chain/greenfield-chain-sdk';
import RefreshIcon from '@/public/images/icons/refresh.svg';
import { getSpOffChainData } from '@/store/slices/persist';
import { BatchOperations } from '@/modules/object/components/BatchOperations';
import { setupBucketQuota } from '@/store/slices/bucket';
import { MenuCloseIcon, MenuOpenIcon } from '@totejs/icons';
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
  const { folders, prefix, path, objectsInfo, bucketName } = useAppSelector((root) => root.object);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { primarySpInfo } = useAppSelector((root) => root.sp);
  const primarySp = primarySpInfo[bucketName];
  const objectList = useAppSelector(selectObjectList);
  const onOpenCreateFolder = () => {
    if (disabled) return;
    dispatch(setEditCreate(true));
  };
  if (!owner) return <></>;

  const folderExist = !prefix ? true : !!objectsInfo[path + '/'];

  const invalidPath =
    folders.some((name) => new Blob([name]).size > MAX_FOLDER_NAME_LEN) || !folderExist;
  const maxFolderDepth = invalidPath || folders.length >= MAX_FOLDER_LEVEL;

  const disabled = maxFolderDepth || discontinue;
  const uploadDisabled = discontinue || invalidPath || folders.length > MAX_FOLDER_LEVEL;

  const handleFilesChange = async (e: ChangeEvent<HTMLInputElement>) => {
    console.log(e);
    const files = e.target.files;
    if (!files || !files.length) return;
    if (files.length > SELECT_OBJECT_NUM_LIMIT) {
      return toast.error({
        description: `You can only upload a maximum of ${SELECT_OBJECT_NUM_LIMIT} objects at a time.`,
        isClosable: true,
      });
    }
    Object.values(files).forEach((file: File) => {
      const time = getUtcZeroTimestamp();
      const id = parseInt(String(time * Math.random()));
      dispatch(addToWaitQueue({ id, file, time }));
    });
    dispatch(setEditUploadStatus(true));
    e.target.value = '';
  };

  /**
   * 1. Determine if it is an empty folder.
   * 2. Determine if the root folder exists in the current directory.
   * 3. Determine the maximum folder depth less than 10.
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
      return toast.error({
        description: `You can only upload a maximum of ${SELECT_OBJECT_NUM_LIMIT} objects at a time.`,
        isClosable: true,
      });
    }
    const relativeRootFolder = files[0].webkitRelativePath.split('/')[0];
    const uploadFolderPath = [...folders, relativeRootFolder].join('/') + '/';
    const isFolderExist = objectList.some(
      (object: ObjectItem) => object.objectName === uploadFolderPath,
    );
    if (isFolderExist) {
      return toast.error({
        description: 'The folder already exists in the current path.',
        isClosable: true,
      });
    }
    // validate folder depth
    for (let i = 0; i < files.length; i++) {
      const webkitRelativePath = files[i].webkitRelativePath;
      const parts = webkitRelativePath.split('/');
      const folders = parts.slice(0, parts.length - 1);
      console.log('prefix', prefix.split('/'), prefix.split('/').filter((item) => !item).length);
      const depth = folders.length + prefix.split('/').filter((item) => !!item).length || 0;
      if (depth > 10) {
        debugger;
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
    console.log('infos', infos);
    Object.values(infos).forEach((file: File) => {
      const time = getUtcZeroTimestamp();
      const id = parseInt(String(time * Math.random()));
      dispatch(addToWaitQueue({ id, file, time }));
    });
    dispatch(setEditUploadStatus(true));
  };

  const refreshList = async () => {
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
  };

  return (
    <Flex gap={12}>
      {showRefresh && (
        <>
          <Flex
            onClick={refreshList}
            alignItems="center"
            height={40}
            marginRight={12}
            cursor="pointer"
          >
            <RefreshIcon />
          </Flex>
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
        visibility={maxFolderDepth ? 'visible' : 'hidden'}
      >
        <GAClick name={gaFolderClickName}>
          <Flex
            bgColor={disabled ? 'readable.tertiary' : 'readable.normal'}
            _hover={{ bg: 'readable.tertiary' }}
            position="relative"
            paddingX="16px"
            paddingY="8px"
            alignItems="center"
            borderRadius={'8px'}
            cursor={disabled ? 'default' : 'pointer'}
            onClick={onOpenCreateFolder}
          >
            <Text color="readable.white" fontWeight={500} fontSize="16px" lineHeight="20px">
              Create Folder
            </Text>
          </Flex>
        </GAClick>
      </Tooltip>
      <Menu>
        {({ isOpen }) => (
          <>
            <Tooltip
              placement="bottom-end"
              content={
                discontinue
                  ? 'Bucket in the discontinue status cannot upload files'
                  : 'Path invalid'
              }
              visibility={uploadDisabled ? 'visible' : 'hidden'}
            >
              <MenuButton
                as={Button}
                height={'40px'}
                bgColor={uploadDisabled ? 'readable.tertiary' : 'readable.brand4'}
                _hover={{ bg: uploadDisabled ? 'readable.tertiary' : '#2EC659' }}
                _disabled={{
                  bg: 'readable.tertiary',
                  cursor: 'default',
                  _hover: { bg: 'readable.tertiary' },
                }}
                position="relative"
                paddingRight={'0'}
                alignItems="center"
                borderRadius={'8px'}
                paddingLeft={'16px'}
                rightIcon={
                  !uploadDisabled && isOpen ? (
                    <Flex
                      paddingX={'4px'}
                      marginLeft={'8px'}
                      height={'40px'}
                      borderRightRadius={'8px'}
                      alignItems={'center'}
                      bgColor={uploadDisabled ? 'readable.tertiary' : 'readable.brand7'}
                    >
                      <MenuOpenIcon />
                    </Flex>
                  ) : (
                    <Flex
                      paddingX={'4px'}
                      marginLeft={'8px'}
                      height={'40px'}
                      borderRightRadius={'8px'}
                      alignItems={'center'}
                      bgColor={uploadDisabled ? 'readable.tertiary' : 'readable.brand7'}
                    >
                      <MenuCloseIcon />
                    </Flex>
                  )
                }
              >
                <UploadIcon color="#fff" w="24px" h="24px" alt="" />{' '}
                <Text
                  color="readable.white"
                  fontWeight={500}
                  fontSize="16px"
                  lineHeight="20px"
                  marginLeft={'8px'}
                >
                  Upload
                </Text>
              </MenuButton>
            </Tooltip>
            {!uploadDisabled && (
              <MenuList>
                {/* <Tooltip
                  placement="bottom-end"
                  content={`Please limit object size to 128MB and upload a maximum of ${SELECT_OBJECT_NUM_LIMIT} objects at a time during testnet. `}
                > */}
                <MenuItem
                  _hover={{
                    color: 'readable.brand7',
                    backgroundColor: 'rgba(0, 186, 52, 0.10)',
                  }}
                >
                  <GAClick name={gaUploadClickName}>
                    <label htmlFor="files-upload">
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
                    </label>
                  </GAClick>
                </MenuItem>
                {/* </Tooltip> */}
                {/* <Tooltip
                  placement="bottom-end"
                  content={
                    disabled
                      ? `You have reached the maximum supported folder depth (${MAX_FOLDER_LEVEL}).`
                      : `The maximum supported folder depth is ${MAX_FOLDER_LEVEL}`
                  }
                > */}
                <MenuItem
                  _hover={{
                    color: 'readable.brand7',
                    backgroundColor: 'rgba(0, 186, 52, 0.10)',
                  }}
                  isDisabled={disabled}
                >
                  <GAClick name={gaUploadClickName}>
                    <label htmlFor="folder-picker">
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
                    </label>
                  </GAClick>
                </MenuItem>
                {/* </Tooltip> */}
              </MenuList>
            )}
          </>
        )}
      </Menu>
    </Flex>
  );
});
