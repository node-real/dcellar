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
  Flex,
} from '@node-real/uikit';
import { useScroll } from 'ahooks';
import cn from 'classnames';
import { memo, useMemo, useRef } from 'react';

import { UploadingPanelKey, useTaskManagementTab } from './useTaskManagementTab';

import { IconFont } from '@/components/IconFont';
import { UploadingObjectsList } from './UploadingObjectsList';
import { UPLOADING_STATUSES, UPLOAD_FAILED_STATUSES, UploadObject } from '@/store/slices/global';
import { UploadActionButton } from './UploadActionButton';

interface UploadingObjectsProps {}

export const UploadingObjects = memo<UploadingObjectsProps>(function UploadingObjects() {
  const ref = useRef(null);
  const scroll = useScroll(ref) || { top: 0 };
  const { tabOptions, activeKey, setActiveKey } = useTaskManagementTab();

  const BatchOperationButton = ({
    panelKey,
    data,
  }: {
    panelKey: UploadingPanelKey;
    data: UploadObject[];
  }) => {
    return (
      <Flex mb={12}>
        {panelKey === UploadingPanelKey.COMPLETE && (
          <UploadActionButton type="clear-all" ids={data.map((item) => item.id)} />
        )}
        {(panelKey === UploadingPanelKey.UPLOADING || panelKey === UploadingPanelKey.ALL) && (
          <UploadActionButton
            type="cancel-all"
            ids={data
              .filter((item) => UPLOADING_STATUSES.includes(item.status))
              .map((item) => item.id)}
          />
        )}
        {(panelKey === UploadingPanelKey.FAILED || panelKey === UploadingPanelKey.STOPPED) && (
          <Flex gap={6}>
            <UploadActionButton type="retry-all" ids={data.map((item) => item.id)} />
            <UploadActionButton type="clear-all" ids={data.map((item) => item.id)} />
          </Flex>
        )}
      </Flex>
    );
  };

  const tabList = useMemo(
    () =>
      tabOptions.map((item) => (
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
      )),
    [tabOptions],
  );

  return (
    <>
      <QDrawerHeader>Task Management</QDrawerHeader>
      <QDrawerBody ref={ref}>
        <Tabs activeKey={activeKey} onChange={(key: any) => setActiveKey(key)}>
          <StyledTabList
            overflowX={'scroll'}
            className={cn({ 'tab-header-fixed': scroll.top > 0 })}
          >
            {tabList}
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
                {item.data.length > 0 && (
                  <>
                    <BatchOperationButton panelKey={item.key} data={item.data} />
                    <UploadingObjectsList data={item.data} />
                  </>
                )}
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
