import React, { ChangeEvent, memo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { GAClick } from '@/components/common/GATracker';
import {
  Flex,
  Text,
  Tooltip,
  toast,
} from '@totejs/uikit';
import UploadIcon from '@/public/images/files/upload_transparency.svg';
import {
  SELECT_OBJECT_NUM_LIMIT,
  setEditCreate,
  setEditUploadStatus,
  setListRefreshing,
  setRestoreCurrent,
  setupListObjects,
} from '@/store/slices/object';
import { addToWaitQueue } from '@/store/slices/global';
import { getUtcZeroTimestamp } from '@bnb-chain/greenfield-chain-sdk';
import { MenuCloseIcon, MenuOpenIcon } from '@totejs/icons';
import RefreshIcon from '@/public/images/icons/refresh.svg';
import { getSpOffChainData } from '@/store/slices/persist';
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
      })
    }
    const uploadIds: number[] = [];
    Object.values(files).forEach((file: File) => {
      const time = getUtcZeroTimestamp();
      const id = parseInt(String(time * Math.random()));
      uploadIds.push(id);
      dispatch(addToWaitQueue({ id, file, time }));
    });
    dispatch(setEditUploadStatus(true));
    e.target.value = '';
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
    dispatch(setListRefreshing(true));
    dispatch(setRestoreCurrent(false));
    await dispatch(setupListObjects(params));
    dispatch(setListRefreshing(false));
  };

  return (
    <Flex gap={12}>
      {showRefresh && (
        <Flex
          onClick={() => refreshList()}
          alignItems="center"
          height={40}
          marginRight={12}
          cursor="pointer"
        >
          <RefreshIcon />
        </Flex>
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
      <Tooltip
        placement="bottom-end"
        content={
          discontinue
            ? 'Bucket in the discontinue status cannot upload files.'
            : uploadDisabled
            ? 'Folder does not exist.'
            : 'Please limit object size to 128MB and upload a maximum of 10 objects at a time during testnet. '
        }
        // visibility={uploadDisabled ||  ? 'visible' : 'hidden'}
      >
        <GAClick name={gaUploadClickName}>
          <label htmlFor="file-upload" className="custom-file-upload">
            <Flex
              bgColor={uploadDisabled ? '#AEB4BC' : 'readable.brand6'}
              _hover={{ bg: uploadDisabled ? '#AEB4BC' : '#2EC659' }}
              position="relative"
              paddingX="16px"
              paddingY="8px"
              alignItems="center"
              borderRadius={'8px'}
              cursor={uploadDisabled ? 'default' : 'pointer'}
            >
              <UploadIcon color="#fff" w="24px" h="24px" alt="" />
              <Text
                color="readable.white"
                fontWeight={500}
                fontSize="16px"
                lineHeight="20px"
                marginLeft={8}
              >
                Upload
              </Text>
            </Flex>
            {!uploadDisabled && (
              <input
                type="file"
                id="file-upload"
                onChange={handleFilesChange}
                multiple
                style={{
                  visibility: 'hidden',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
            )}
          </label>
        </GAClick>
      </Tooltip>
      {/* <Menu>
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
                <MenuItem
                  _hover={{
                    color: 'readable.brand7',
                    backgroundColor: 'rgba(0, 186, 52, 0.10)',
                  }}
                >
                  <GAClick name={gaUploadClickName}>
                    <label htmlFor="files-upload" className="custom-file-upload">
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
              </MenuList>
            )}
          </>
        )}
      </Menu> */}
    </Flex>
  );
});
