import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { IconFont } from '@/components/IconFont';
import { UnderlineLink } from '@/components/layout/Footer';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupObjectActivities } from '@/store/slices/object';
import { formatFullTime } from '@/utils/time';
import { getShortenWalletAddress } from '@/utils/wallet';
import { Box, Circle, Flex, Link, Text } from '@totejs/uikit';
import { useAsyncEffect } from 'ahooks';
import React, { useEffect } from 'react';
import { CopyText } from '@/components/common/CopyText';
import { formatAddress } from '@/utils/string';
import { GAClick } from '@/components/common/GATracker';
import { isEmpty } from 'lodash-es';
import { Loading } from '@/components/common/Loading';
import { formatTxType } from '@/utils/object';

type Props = {
  objectId: string;
};
export const ObjectActivities = ({ objectId }: Props) => {
  const { objectActivities } = useAppSelector((root) => root.object);
  const curObjectAT = objectActivities[objectId];
  console.log('objectActivities', objectActivities);
  const dispatch = useAppDispatch();

  useAsyncEffect(async () => {
    dispatch(setupObjectActivities(objectId));
  }, [objectId]);

  if (isEmpty(curObjectAT)) {
    return <Loading mt={24}/>
  }
  return (
    <Flex flexDirection={'column'}>
      {curObjectAT &&
        curObjectAT.map((item, index) => {
          return (
            <Flex key={index} position={'relative'} gap={8}>
              <Circle size={24} bgColor={'bg.bottom'}>
                <IconFont w={16} type="object" />
              </Circle>
              <Box mb={16} fontWeight={500}>
                <Flex mb={12} alignItems={'baseline'}>
                  <Text display={'inline'} color={'readable.tertiary'}>
                    {formatTxType(item.txType)}
                  </Text>
                  &nbsp;
                  <Text display={'inline'}>Transaction Hash</Text>
                  &nbsp;
                  <CopyText value={item.tx} gaClickName={''}>
                    <GAClick name={''}>
                      <Link
                        display={'inline'}
                        target="_blank"
                        color="#1184EE"
                        cursor={'pointer'}
                        textDecoration={'underline'}
                        _hover={{
                          color: '#3C9AF1',
                        }}
                        href={`${GREENFIELD_CHAIN_EXPLORER_URL}/tx/${item.tx}`}
                        fontSize={'14px'}
                        lineHeight={'17px'}
                        fontWeight={500}
                      >
                        {getShortenWalletAddress(item.tx)}
                      </Link>
                    </GAClick>
                  </CopyText>
                </Flex>
                <Flex gap={2} alignItems={'center'}>
                  <IconFont w={16} type="date" />
                  <Text fontSize={12} fontWeight={400} color={'readable.disable'}>
                    {formatFullTime(new Date(item.time).valueOf(), 'MMM D YYYY HH:mm:ss A')}
                  </Text>
                </Flex>
              </Box>
              {curObjectAT?.length > 0 && index !== curObjectAT.length - 1 && (
                <Box
                  position={'absolute'}
                  width={2}
                  height={'100%'}
                  maxH={'calc(100% - 24px)'}
                  top={28}
                  left={11}
                  bgColor={'readable.border'}
                ></Box>
              )}
            </Flex>
          );
        })}
    </Flex>
  );
};
