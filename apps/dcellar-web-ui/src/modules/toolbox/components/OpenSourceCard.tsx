import { Badge, Flex, Text } from '@node-real/uikit';

import { Card, CircleLink } from './Common';

import { IconFont } from '@/components/IconFont';

export const OpenSourceCard = () => {
  return (
    <Card>
      <IconFont type="source-code" w={48} />
      <Flex justifyContent={'space-between'} gap={8}>
        <Text fontSize={16} fontWeight={600} flex={1}>
          DCellar Open Source
        </Text>
        <CircleLink title="github" href="https://github.com/node-real/dcellar/">
          <IconFont type="line-github" w={16} />
        </CircleLink>
      </Flex>

      <Badge colorScheme="primary" width={'fit-content'} borderRadius={4}>
        Developer Tool
      </Badge>
      <Text color={'readable.secondary'}>
        Utilize DCellar open-source codebase and encourage collaboration to improve and extend its
        functionality.
      </Text>
    </Card>
  );
};
