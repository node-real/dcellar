import React, { useCallback } from 'react';
import {
  Empty,
  EmptyDescription,
  Flex,
  Image,
  QDrawerBody,
  QDrawerCloseButton,
  QDrawerHeader,
  QListItem,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@totejs/uikit';
import { FILE_UPLOAD_STATIC_URL, UPLOAD_TASK_EMPTY_ICON } from '@/modules/file/constant';
import { ColoredErrorIcon, ColoredSuccessIcon, Icon } from '@totejs/icons';
import { Loading } from '@/components/common/Loading';
import { UploadFile } from '@/store/slices/global';
import { useTaskManagementTab } from './useTaskManagementTab';
import styled from '@emotion/styled';
import { NameItem } from './NameItem';
import { PathItem } from './PathItem';
import { UploadProgress } from './UploadProgress';

export const UploadingObjects = () => {
  const { queue, tabOptions, activeKey, setActiveKey } = useTaskManagementTab();
  const FileStatus = useCallback(({ task }: { task: UploadFile }) => {
    switch (task.status) {
      case 'WAIT':
        return (
          <>
            <Loading justifyContent={'flex-end'} />
            <Text marginLeft={'4px'}>waiting</Text>
          </>
        );
      case 'HASH':
        return (
          <>
            <Loading justifyContent={'flex-end'} />
            <Text marginLeft={'4px'}>hashing</Text>
          </>
        );
      case 'READY':
        return <UploadProgress value={0} />
      case 'UPLOAD':
        return<UploadProgress value={task.progress || 0} />
      case 'SEAL':
        return (
          <>
            <Loading justifyContent={'flex-end'} />
            <Text marginLeft={'4px'}>sealing</Text>
          </>
        );
      case 'FINISH':
        return <ColoredSuccessIcon />;
      case 'ERROR':
        return <ColoredErrorIcon />;
      case 'CANCEL':
        return <ColoredErrorIcon />;
      default:
        return null;
    }
  }, []);
  if (!queue.length) {
    return (
      <>
        <QDrawerCloseButton />
        <QDrawerHeader>Task Management</QDrawerHeader>
        <QDrawerBody>
          <Flex
            flexDirection={'column'}
            width={'100%'}
            height={'100%'}
            alignItems={'center'}
            justifyContent={'center'}
          >
            <Image alt="upload" src={FILE_UPLOAD_STATIC_URL} width={'120px'} />
            <Text marginTop={'12px'}>You don't have upload tasks.</Text>
          </Flex>
        </QDrawerBody>
      </>
    );
  }

  return (
    <>
      <QDrawerCloseButton />
      <QDrawerHeader>Task Management</QDrawerHeader>
      <QDrawerBody>
        <Tabs activeKey={activeKey} onChange={(key: any) => setActiveKey(key)}>
          <StyledTabList overflowX={'scroll'}>
            {tabOptions.map((item) => (
              <Tab
                h="auto"
                borderBottom={'3px solid red'}
                key={item.key}
                tabKey={item.key}
                paddingBottom={'8px'}
                _hover={{
                  color: 'readable.brand6',
                  fontWeight: '600',
                  borderBottom: '3px solid readable.brand6',
                }}
                _selected={{
                  color: 'readable.brand6',
                  fontWeight: '600',
                  borderBottom: '3px solid readable.brand6',
                }}
              >
                {item.icon}
                {item.title}({item.data.length})
              </Tab>
            ))}
          </StyledTabList>
          <TabPanels>
            {tabOptions.map((item) => (
              <TabPanel key={item.key} panelKey={item.key}>
                {item.data.length === 0 && (
                  <Empty>
                    <Image
                      alt="Empty"
                      src={UPLOAD_TASK_EMPTY_ICON}
                      width={'100px'}
                      marginBottom={16}
                    />
                    {/* <EmptyTitle>Title</EmptyTitle> */}
                    <EmptyDescription color="readable.secondary">
                      There are no objects in the list.
                    </EmptyDescription>
                  </Empty>
                )}
                {item.data &&
                  item.data.map((task) => (
                    <QListItem
                      cursor={'default'}
                      _hover={{}}
                      maxW={'520px'}
                      key={task.id}
                      paddingX={'6px'}
                      right={null}
                      display="block"
                    >
                      <Flex
                        marginLeft={'12px'}
                        fontSize={'12px'}
                        alignItems={'center'}
                        justifyContent={'space-between'}
                      >
                        <NameItem
                          name={task.file.name}
                          size={task.file.size}
                          msg={task.msg}
                          status={task.status}
                          maxW="200px"
                          flex="1"
                        />
                        <PathItem path={[task.bucketName, task.prefixFolders].join('/')} />
                        <Flex width={'100px'} justifyContent={'flex-end'} alignItems={'center'}>
                          <FileStatus task={task} />
                        </Flex>
                      </Flex>
                    </QListItem>
                  ))}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
        {/* {queue.map((task) => {
          const prefix = `${[task.bucketName, ...task.prefixFolders].join('/')}/`;
          return (
            <QListItem
              cursor={'default'}
              _hover={{}}
              maxW={'520px'}
              key={task.id}
              paddingX={'6px'}
              right={null}
              display="block"
            >
              <Flex
                marginLeft={'12px'}
                fontSize={'12px'}
                alignItems={'center'}
                justifyContent={'space-between'}
              >
                <Box maxW="200px" flex={1}>
                  <EllipsisText marginRight={'12px'} title={task.file.name}>
                    {task.file.name}
                  </EllipsisText>
                  {task.msg ? (
                    <EllipsisText color={'red'} title={task.msg}>
                      {task.msg}
                    </EllipsisText>
                  ) : (
                    <EllipsisText>{formatBytes(task.file.size)}</EllipsisText>
                  )}
                </Box>
                <EllipsisText maxW="200px" textAlign={'center'} marginRight={'12px'} title={prefix}>
                  {prefix}
                </EllipsisText>
                <Flex width={'100px'} justifyContent={'flex-end'} alignItems={'center'}>
                  <FileStatus task={task} />
                </Flex>
              </Flex>
            </QListItem>
          );
        })} */}
      </QDrawerBody>
    </>
  );
};

const StyledTabList = styled(TabList)`
  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none; /* firefox */
  -ms-overflow-style: none; /* IE 10+ */
  overflow-x: scroll;
`;
