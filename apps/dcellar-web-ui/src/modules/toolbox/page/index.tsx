import { Box, Flex, Text } from '@totejs/uikit';
import { NFTMigrationCard } from '../components.ts/NFTMigrationCard';
import { TellUsCard } from '../components.ts/TellUsCard';
import { ToolboxOperations } from '../components.ts/ToolboxOperation';

export const ToolBoxPage = () => {
  return (
    <>
      <ToolboxOperations />
      <Box>
        <Text as="h1" fontSize={24} fontWeight={700} mb={16}>
          Toolbox
        </Text>
        <Flex gap={16} flexWrap={'wrap'}>
          <NFTMigrationCard />
          <TellUsCard />
        </Flex>
      </Box>
    </>
  );
};
