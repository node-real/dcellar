import { DCButton } from '@/components/common/DCButton';
import { GAClick } from '@/components/common/GATracker';
import { ButtonVariantType, Flex, MenuButton, MenuItem, MenuList, Text } from '@node-real/uikit';
import { ChangeEvent, PropsWithChildren, memo } from 'react';

interface UploadMenuListProps extends PropsWithChildren {
  disabled: boolean;
  handleFilesChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handlerFolderChange: (e: ChangeEvent<HTMLInputElement>) => void;
  gaUploadClickName?: string;
  variant?: ButtonVariantType;
  name?: string;
}

export const UploadMenuList = memo<UploadMenuListProps>(function UploadMenuList({
  disabled,
  handleFilesChange,
  handlerFolderChange,
  gaUploadClickName = 'dc.file.upload.click',
  children,
  variant = 'brand',
  name = '',
}) {
  return (
    <>
      <MenuButton
        as={DCButton}
        position="relative"
        paddingRight={'0'}
        disabled={disabled}
        variant={variant}
        _expanded={{
          '.ui-icon': {
            transform: 'rotate(-270deg)',
          },
          '.ui-icon__container': {
            bgColor: '#009E2C',
          },
        }}
      >
        {children}
      </MenuButton>
      {!disabled && (
        <MenuList>
          <label htmlFor={`files-upload-${name}`}>
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
                  id={`files-upload-${name}`}
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
          <label htmlFor={`folder-picker-${name}`}>
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
                  id={`folder-picker-${name}`}
                  name={`folder-upload-${name}`}
                  // @ts-expect-error webkitdirectory="true" and directory="true" are not in the types
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
    </>
  );
});
