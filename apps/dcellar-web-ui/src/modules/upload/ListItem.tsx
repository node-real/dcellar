import styled from '@emotion/styled';
import { Flex, Menu } from '@node-real/uikit';
import cn from 'classnames';
import { isEmpty } from 'lodash-es';
import { ChangeEvent, useMemo } from 'react';

import { IconFont } from '@/components/IconFont';
import { UploadMenuList } from '@/modules/object/components/UploadMenuList';
import { useAppDispatch, useAppSelector } from '@/store';
import { addToWaitQueue } from '@/store/slices/global';
import { TransferItemTree } from '@/utils/dom';
import { getTimestamp } from '@/utils/time';
import { UploadObjectsList } from './UploadObjectsList';

type ListItemProps = {
  path: string;
  type: 'ALL' | 'WAIT' | 'ERROR';
  handleFolderTree: (tree: TransferItemTree) => void;
};

export const ListItem = ({ path, type, handleFolderTree }: ListItemProps) => {
  const dispatch = useAppDispatch();
  const objectWaitQueue = useAppSelector((root) => root.global.objectWaitQueue);

  const list = useMemo(() => {
    switch (type) {
      case 'ALL':
        return objectWaitQueue;
      case 'WAIT':
        return objectWaitQueue.filter((file) => file.status === 'WAIT');
      case 'ERROR':
        return objectWaitQueue.filter((file) => file.status === 'ERROR');
      default:
        return objectWaitQueue;
    }
  }, [objectWaitQueue, type]);

  const onFilesChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const tree: TransferItemTree = {};
    Object.values(files).forEach((file: File) => {
      const time = getTimestamp();
      const id = parseInt(String(time * Math.random()));
      dispatch(addToWaitQueue({ id, file, time }));
      tree[file.name] = file;
    });
    handleFolderTree(tree);
    e.target.value = '';
  };

  const onFolderChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const tree: TransferItemTree = {};
    if (!files || !files.length) {
      handleFolderTree(tree);
      return;
    }
    Object.values(files).forEach((file) => {
      const folders = file.webkitRelativePath.split('/').slice(0, -1);
      let relativePath = '';
      folders.forEach((folder) => {
        relativePath += folder + '/';
        if (!tree[relativePath] && relativePath) {
          // folder object
          tree[relativePath] = new File([], relativePath, { type: 'text/plain' });
        }
      });
      // file object
      tree[file.webkitRelativePath] = file;
    });
    handleFolderTree(tree);
    e.target.value = '';
  };

  return (
    <>
      <DropContainer className={cn({ 'drop-area-small': !isEmpty(list) })}>
        <IconFont type={'drag-upload'} w={64} />
        <Flex alignItems={'center'}>
          Drag and drop objects here or{' '}
          <Menu>
            {({ isOpen }) => (
              <UploadMenuList
                variant={'text'}
                disabled={false}
                handleFilesChange={onFilesChange}
                handlerFolderChange={onFolderChange}
                name="drag"
                gaUploadClickName="dc.file.drag.upload.click"
              >
                <Flex
                  ml={-8}
                  color={'brand.brand6'}
                  alignItems="center"
                  fontSize={isEmpty(list) ? 16 : 14}
                  _hover={{
                    color: 'brand.brand5',
                  }}
                >
                  browse files <IconFont w={16} type={isOpen ? 'menu-open' : 'menu-close'} />
                </Flex>
              </UploadMenuList>
            )}
          </Menu>
        </Flex>
      </DropContainer>
      <Flex width="100%" flexDirection={'column'} alignItems={'center'} display={'flex'}>
        {list && list.length > 0 && <UploadObjectsList data={list} path={path} />}
      </Flex>
    </>
  );
};

const DropContainer = styled(Flex)`
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
  padding: 24px 40px;
  border-radius: 4px;
  border: 1px dashed var(--ui-colors-readable-disable);
  color: var(--ui-colors-readable-secondary);
  font-size: 16px;
  font-weight: 500;
  margin: 24px 0;

  &.drop-area-small {
    padding: 16px 40px;
    flex-direction: row;
    gap: 8px;
    margin: 12px 0;
    font-size: 14px;

    svg {
      width: 20px;
      height: 20px;
    }
  }
`;
