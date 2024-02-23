import { Flex, Text } from '@node-real/uikit';

import { IconFont } from '@/components/IconFont';

export const WarningInfo = ({ content }: { content: string }) => {
  return (
    <Flex alignItems={'center'} mt="8px">
      <IconFont color="#EE7C11" type={'warning'} w={16} />
      <Text
        ml="4px"
        fontSize={'14px'}
        lineHeight="17px"
        fontWeight={400}
        color={'readable.tertiary'}
      >
        {content}
      </Text>
    </Flex>
  );
};
