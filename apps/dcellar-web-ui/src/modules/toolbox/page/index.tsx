import { Box, Flex, Text } from '@node-real/uikit';

import { TellUsCard } from '../components/TellUsCard';
import { UploadKitCard } from '../components/UploadkitCard';
import { OpenSourceCard } from '../components/OpenSourceCard';

export const ToolBoxPage = () => {
  return (
    <Box>
      <Text as="h1" fontSize={24} fontWeight={700} mb={16}>
        Toolbox
      </Text>
      <Flex gap={16} flexWrap={'wrap'}>
        <UploadKitCard />
        <OpenSourceCard />
        <TellUsCard />
      </Flex>
    </Box>
  );
};
