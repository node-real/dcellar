import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { IconFont } from '@/components/IconFont';
import { CopyText } from '@/components/common/CopyText';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import { Activity } from '@/store/slices/object';
import { formatMsgType } from '@/utils/object';
import { trimAddress } from '@/utils/string';
import { formatFullTime } from '@/utils/time';
import { Box, Center, Flex, Link, Loading, Text } from '@node-real/uikit';
import { memo } from 'react';

interface ActivitiesProps {
  loading: boolean;
  activities: Activity[];
}

export const Activities = memo<ActivitiesProps>(function Activities({ loading, activities }) {
  if (loading) return <Loading w={'100%'} my={24} size={24} />;
  if (!activities.length)
    return (
      <ListEmpty
        empty
        h={240}
        type="empty-object"
        title="No Records"
        desc="There are no records at the moment."
      />
    );

  return (
    <>
      {activities.map((item, index) => (
        <Flex key={index} gap={8}>
          <Flex flexDirection={'column'} alignItems={'center'}>
            <Center w={24} h={24} borderRadius={12} bgColor={'bg.bottom'} alignItems={'center'}>
              <IconFont type="object" w={16} h={16} />
            </Center>
            {index < activities.length - 1 && (
              <Box flex={1} width={1} bgColor={'readable.border'} />
            )}
          </Flex>
          <Flex fontWeight={500} flexDirection={'column'} gap={8}>
            <Flex alignItems={'center'}>
              <Text as="span" color={'readable.tertiary'}>
                {formatMsgType(item.tx_result.type)}&nbsp;
              </Text>
              <Text as="span" color={'readable.normal'}>
                Transaction Hash
              </Text>
              &nbsp; (
              <Link
                color={'#1184EE'}
                _hover={{ color: '#3C9AF1' }}
                href={`${GREENFIELD_CHAIN_EXPLORER_URL}/tx/0x${item.hash}`}
                target="_blank"
                fontSize={12}
                textDecoration={'underline'}
              >
                0x{trimAddress(item.hash, 28, 6, 5)}
              </Link>
              )
              <CopyText value={`0x${item.hash}`} />
            </Flex>
            <Flex gap={2} alignItems={'center'} mb={16} fontSize={12}>
              <IconFont type="calendar" w={16} h={16} />
              <Text as="span" color={'readable.tertiary'}>
                {formatFullTime(item.time)}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      ))}
      {activities.length >= 100 && (
        <Text textAlign={'center'} fontSize={12} color={'readable.tertiary'}>
          Only showing the latest 100 activities ~
        </Text>
      )}
    </>
  );
});
