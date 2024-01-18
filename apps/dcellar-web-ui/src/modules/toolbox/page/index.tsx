import { Box, Flex, Text } from '@totejs/uikit';
import { TellUsCard } from '../components/TellUsCard';
import { UploadKitCard } from '../components/UploadkitCard';

export const ToolBoxPage = () => {
  return (
    <>
      <Box>
        <Text as="h1" fontSize={24} fontWeight={700} mb={16}>
          Toolbox
        </Text>
        <Flex gap={16} flexWrap={'wrap'}>
          <UploadKitCard/>
          <TellUsCard />
        </Flex>
      </Box>
    </>
  );
};