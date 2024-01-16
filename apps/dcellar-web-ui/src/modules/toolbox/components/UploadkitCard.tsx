import { IconFont } from '@/components/IconFont';
import { Badge, Flex, Text } from '@totejs/uikit';
import { Card, CircleLink } from './Common';

export const UploadKitCard = () => {
  return (
    <Card>
      <IconFont type="upload" w={48} />
      <Flex justifyContent={'space-between'} gap={8}>
        <Text fontSize={16} fontWeight={600} flex={1}>
          Greenfield UploadKit
        </Text>
        <CircleLink title="github" href="https://github.com/node-real/greenfield-toolkit/tree/main/packages/uploadkit">
          <IconFont type="line-github" w={16} />
        </CircleLink>
        <CircleLink title="doc" href="https://node-real.github.io/greenfield-toolkit">
          <IconFont type="doc" w={16} ml={2} />
        </CircleLink>
        <CircleLink
          title="npm"
          href="https://www.npmjs.com/package/@node-real/greenfield-uploadkit"
        >
          <IconFont type="npm" w={16} />
        </CircleLink>
      </Flex>

      <Badge colorScheme="primary" width={'fit-content'} borderRadius={4}>
        Component
      </Badge>
      <Text color={'readable.secondary'}>
        Greenfield Upload UIKit is offered by NodeReal, it's fully open sourced, developers can
        easily integrate into their WebUI dApps.
      </Text>
    </Card>
  );
};
