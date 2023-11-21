import { Circle, Flex, Text } from '@totejs/uikit';
import React, { useMemo } from 'react';
import { Card } from './Common';
import { IconFont } from '@/components/IconFont';
import { useAppSelector } from '@/store';
import { selectBucketList } from '@/store/slices/bucket';
import { selectPaymentAccounts } from '@/store/slices/accounts';

export const Stats = () => {
  const { loginAccount } = useAppSelector((root) => root.persist);
  const bucketList = useAppSelector(selectBucketList(loginAccount));
  const paymentList = useAppSelector(selectPaymentAccounts(loginAccount));
  const statsData = useMemo(() => {
    return [
      {
        name: 'buckets',
        icon: 'bucket',
        value: bucketList?.length || 0,
      },
      // {
      //   name: 'Objects',
      //   icon: 'doc1',
      //   value: 12321030213,
      // },
      // {
      //   name: 'Groups',
      //   icon: 'group',
      //   value: 5,
      // },
      {
        name: 'Accounts',
        icon: 'account',
        // payment account length + a owner account
        value: (paymentList?.length || 0) + 1,
      },
    ];
  }, [bucketList?.length, paymentList?.length]);

  return (
    <Flex gap={16}>
      {statsData.map((item, index) => (
        <Card key={index} flex={1}>
          <Flex justifyContent={'space-between'}>
            <Text fontWeight={500} color={'readable.secondary'}>
              {item.name}
            </Text>
            <Circle bg={'opacity1'} size={24}>
              <IconFont type={item.icon} w={16} color={'brand.brand6'} />
            </Circle>
          </Flex>
          <Text fontSize={24} fontWeight={600}>
            {item.value}
          </Text>
        </Card>
      ))}
    </Flex>
  );
};
