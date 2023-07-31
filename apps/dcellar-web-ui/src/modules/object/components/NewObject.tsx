import React, { ChangeEvent, memo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { GAClick } from '@/components/common/GATracker';
import { Flex, Text, Tooltip } from '@totejs/uikit';
import UploadIcon from '@/public/images/files/upload_transparency.svg';
import { setEditCreate, setEditUpload } from '@/store/slices/object';
import { addToHashQueue } from '@/store/slices/global';
import { getUtcZeroTimestamp } from '@bnb-chain/greenfield-chain-sdk';

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
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files || [];
    if (!files.length) return;
    const id = getUtcZeroTimestamp();
    dispatch(addToHashQueue({ id, file: files[0] }));
    dispatch(setEditUpload(id));
    e.target.value = '';
  };
  if (!owner) return <></>;

  const folderExist = !prefix ? true : !!objectsInfo[path + '/'];

  const invalidPath =
    folders.some((name) => new Blob([name]).size > MAX_FOLDER_NAME_LEN) || !folderExist;
  const maxFolderDepth = invalidPath || folders.length >= MAX_FOLDER_LEVEL;

  const disabled = maxFolderDepth || discontinue;
  const uploadDisabled = discontinue || invalidPath || folders.length > MAX_FOLDER_LEVEL;

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
      <Tooltip
        placement="bottom-end"
        content={
          discontinue
            ? 'Bucket in the discontinue status cannot upload objects.'
            : 'Folder does not exist.'
        }
        visibility={uploadDisabled ? 'visible' : 'hidden'}
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
              <Text color="readable.white" fontWeight={500} fontSize="16px" lineHeight="20px">
                Upload
              </Text>
            </Flex>
            {!uploadDisabled && (
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
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
    </Flex>
  );
});
