import React, { memo, useCallback, useRef } from 'react';
import {
  Empty,
  Flex,
  QDrawerBody,
  QDrawerHeader,
  QListItem,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@node-real/uikit';
import { Loading } from '@/components/common/Loading';
import { UploadFile } from '@/store/slices/global';
import { useTaskManagementTab } from './useTaskManagementTab';
import styled from '@emotion/styled';
import { NameItem } from './NameItem';
import { PathItem } from './PathItem';
import { UploadProgress } from './UploadProgress';
import { IconFont } from '@/components/IconFont';
import cn from 'classnames';
import { useScroll } from 'ahooks';
import { EditTags } from '@/components/common/ManageTags';

interface UploadingObjectsProps {}

export const UploadingObjects = memo<UploadingObjectsProps>(function UploadingObjects() {
  const ref = useRef(null);
  const scroll = useScroll(ref) || { top: 0 };
  const { queue, tabOptions, activeKey, setActiveKey } = useTaskManagementTab();
  const FileStatus = useCallback(({ task }: { task: UploadFile }) => {
    switch (task.status) {
      case 'WAIT':
        return (
          <>
            <Loading iconSize={12} justifyContent={'flex-end'} />
            <Text marginLeft={'4px'} fontWeight={400}>
              Waiting
            </Text>
          </>
        );
      case 'HASH':
        return (
          <>
            <Loading iconSize={12} justifyContent={'flex-end'} />
            <Text marginLeft={'4px'} fontWeight={400}>
              Hashing
            </Text>
          </>
        );
      case 'HASHED':
        return <UploadProgress value={0} />;
      case 'SIGN':
        return <UploadProgress value={0} />;
      case 'SIGNED':
        return <UploadProgress value={0} />;
      case 'UPLOAD':
        return <UploadProgress value={task.progress || 0} />;
      case 'SEAL':
        return (
          <>
            <Loading iconSize={12} justifyContent={'flex-end'} />
            <Text marginLeft={'4px'} fontWeight={400}>
              Sealing
            </Text>
          </>
        );
      case 'FINISH':
        return <IconFont type="colored-success" w={16} mr={8} />;
      case 'ERROR':
        return <IconFont type="colored-error2" w={20} mr={6} />;
      case 'CANCEL':
        return <IconFont type="colored-error2" w={20} mr={6} />;
      default:
        return null;
    }
  }, []);

  return (
    <>
      <QDrawerHeader>Task Management</QDrawerHeader>
      <QDrawerBody ref={ref}>
        <Tabs activeKey={activeKey} onChange={(key: any) => setActiveKey(key)}>
          <StyledTabList
            overflowX={'scroll'}
            className={cn({ 'tab-header-fixed': scroll.top > 0 })}
          >
            {tabOptions.map((item) => (
              <Tab
                h="auto"
                key={item.key}
                fontSize={14}
                fontWeight={500}
                tabKey={item.key}
                paddingBottom={6}
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
                    <IconFont type="empty-object" w={120} />
                    <Text marginTop={'16px'} fontWeight={500} color={'readable.secondary'}>
                      There are no objects in the list.
                    </Text>
                  </Empty>
                )}
                {item.data?.map((task) => (
                  <QListItem
                    cursor={'default'}
                    _hover={{
                      bg: 'opacity1',
                    }}
                    h={48}
                    maxW={'520px'}
                    key={task.id}
                    paddingX={'0'}
                    right={null}
                    display="block"
                  >
                    <Flex fontSize={'12px'} alignItems={'center'} justifyContent={'space-between'}>
                      <NameItem
                        name={task.waitFile.name}
                        size={task.waitFile.size}
                        msg={task.msg}
                        status={task.status}
                        w={240}
                        task={task}
                      />
                      <PathItem
                        status={task.status}
                        path={
                          [task.bucketName, ...task.prefixFolders]
                            .filter((item) => !!item)
                            .join('/') + '/'
                        }
                      />
                      <Flex width={'70px'} justifyContent={'flex-end'} alignItems={'center'}>
                        <FileStatus task={task} />
                      </Flex>
                    </Flex>
                  </QListItem>
                ))}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </QDrawerBody>
    </>
  );
});

const StyledTabList = styled(TabList)`
  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none; /* firefox */
  -ms-overflow-style: none; /* IE 10+ */
  overflow-x: scroll;

  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--ui-colors-bg-middle);
`;
