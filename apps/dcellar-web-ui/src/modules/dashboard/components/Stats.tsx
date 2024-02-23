import { IconFont } from '@/components/IconFont';
import { InternalRoutePaths } from '@/constants/paths';
import { useAppSelector } from '@/store';
import { selectPaymentAccounts } from '@/store/slices/accounts';
import { selectBucketList } from '@/store/slices/bucket';
import { Circle, Flex, Text } from '@node-real/uikit';
import { isEmpty } from 'lodash-es';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { Card } from './Common';

export const Stats = () => {
  const router = useRouter();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { buckets } = useAppSelector((root) => root.bucket);
  const { paymentAccounts } = useAppSelector((root) => root.accounts);
  const bucketList = useAppSelector(selectBucketList(loginAccount));
  const paymentList = useAppSelector(selectPaymentAccounts(loginAccount));
  const statsData = useMemo(() => {
    return [
      {
        name: 'Buckets',
        icon: 'bucket',
        value: isEmpty(buckets) ? '--' : bucketList?.length || 0,
        link: InternalRoutePaths.buckets,
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
        value: isEmpty(paymentAccounts) ? '--' : (paymentList?.length || 0) + 1,
        link: InternalRoutePaths.accounts,
      },
    ];
  }, [bucketList?.length, buckets, paymentAccounts, paymentList?.length]);
  const onNavigate = (target: string) => () => {
    router.push(target);
  };

  return (
    <Flex gap={16}>
      {statsData.map((item, index) => (
        <Card
          key={index}
          flex={1}
          _hover={{
            border: '1px solid brand.brand6',
            cursor: 'pointer',
          }}
          onClick={onNavigate(item.link)}
        >
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
