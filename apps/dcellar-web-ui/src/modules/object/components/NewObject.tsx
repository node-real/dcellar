import React, { ChangeEvent, memo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { GAClick } from '@/components/common/GATracker';
import { Button, Flex, Menu, MenuButton, MenuItem, MenuList, Text, Tooltip } from '@totejs/uikit';
import UploadIcon from '@/public/images/files/upload_transparency.svg';
import { setEditCreate, setEditUpload } from '@/store/slices/object';
import { addToHashQueue } from '@/store/slices/global';
import { getUtcZeroTimestamp } from '@bnb-chain/greenfield-chain-sdk';
import { MenuCloseIcon, MenuOpenIcon } from '@totejs/icons';

interface NewObjectProps {
  gaFolderClickName?: string;
  gaUploadClickName?: string;
}

const MAX_FOLDER_LEVEL = 10;
const MAX_FOLDER_NAME_LEN = 70;

export const NewObject = memo<NewObjectProps>(function NewObject({
  gaFolderClickName = '',
  gaUploadClickName = '',
}) {
  const dispatch = useAppDispatch();
  const { discontinue, owner } = useAppSelector((root) => root.bucket);
  const { folders, prefix, path, objectsInfo } = useAppSelector((root) => root.object);
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
    console.log('files', e.target.files, typeof e.target.files);
    const files = e.target.files;
    if (!files || !files.length) return;
    const uploadIds: number[] = [];
    Object.values(files).forEach((file: File) => {
      const time = getUtcZeroTimestamp();
      const id = parseInt(String(time * Math.random()));
      uploadIds.push(id);
      dispatch(addToHashQueue({ id, file, time }));
    });
    dispatch(setEditUpload(1));
    e.target.value = '';
  };

  return (
    <Flex gap={12}>
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
      </Menu>
    </Flex>
  );
});
