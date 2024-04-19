import styled from '@emotion/styled';
import {
  Empty,
  QDrawerBody,
  QDrawerHeader,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@node-real/uikit';
import { useScroll } from 'ahooks';
import cn from 'classnames';
import { memo, useRef } from 'react';

import { useTaskManagementTab } from './useTaskManagementTab';

import { IconFont } from '@/components/IconFont';
import { UploadingObjectsList } from './UploadingObjectsList';

interface UploadingObjectsProps {}

export const UploadingObjects = memo<UploadingObjectsProps>(function UploadingObjects() {
  const ref = useRef(null);
  const scroll = useScroll(ref) || { top: 0 };
  const { tabOptions, activeKey, setActiveKey } = useTaskManagementTab();

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
          <TabPanels mt={12}>
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
                {item.data.length > 0 && <UploadingObjectsList data={item.data} />}
                {/* {item.data?.map((task) => (
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
                        name={task.waitObject.name}
                        size={task.waitObject.size}
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
                ))} */}
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
