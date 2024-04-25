import { Box, Flex, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@node-real/uikit';

import { TellUsCard } from '../components/TellUsCard';
import { ToolCards } from '../components/ToolCards';
import { useToolBoxTab } from '../useToolBoxTab';

export const ToolBoxPage = () => {
  const { tabOptions, activeKey, setActiveKey } = useToolBoxTab();

  return (
    <Box>
      <Text as="h1" fontSize={24} fontWeight={700} mb={16}>
        Toolbox
      </Text>
      <Tabs activeKey={activeKey} onChange={(key: any) => setActiveKey(key)}>
        <TabList>
          {tabOptions.map((item) => (
            <Tab
              h="auto"
              key={item.key}
              fontSize={14}
              fontWeight={500}
              tabKey={item.key}
              paddingBottom={6}
            >
              {item.name}
            </Tab>
          ))}
        </TabList>
        <TabPanels mt={12}>
          {tabOptions.map((item) => (
            <TabPanel key={item.key} panelKey={item.key} gap={16} flexWrap={'wrap'}>
              <Flex gap={16} flexWrap={'wrap'}>
                <ToolCards data={item.data} />
                <TellUsCard />
              </Flex>
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  );
};
