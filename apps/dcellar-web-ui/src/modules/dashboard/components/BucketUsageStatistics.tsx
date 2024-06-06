import { Flex, Tab, TabList, TabPanel, TabPanels, Tabs } from '@node-real/uikit';
import { Card, CardTitle } from './Common';
import { BucketStorageUsage } from './BucketStorageUsage';
import { BucketQuotaUsage } from './BucketQuotaUsage';
import { useState } from 'react';

export const BucketUsageStatistics = () => {
  const [activeKey, setActiveKey] = useState<number | string>(0);
  const onChange = (key: number | string) => {
    setActiveKey(key);
  };
  return (
    <Card flex={1} gap={24}>
      <Tabs
        variant="squared"
        alignItems={'center'}
        defaultActiveKey={0}
        activeKey={activeKey}
        onChange={onChange}
      >
        <Flex justifyContent={'space-between'}>
          <CardTitle>Usage Statistics</CardTitle>
          <TabList gap={12}>
            <Tab>Storage Usage</Tab>
            <Tab>Download Quota Usage</Tab>
          </TabList>
        </Flex>

        <TabPanels>
          <TabPanel>{+activeKey === 0 && <BucketStorageUsage />}</TabPanel>
          <TabPanel>{+activeKey === 1 && <BucketQuotaUsage />}</TabPanel>
        </TabPanels>
      </Tabs>
    </Card>
  );
};
