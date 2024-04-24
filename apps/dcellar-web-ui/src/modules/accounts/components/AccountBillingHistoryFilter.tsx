import { useAppDispatch, useAppSelector } from '@/store';
import {
  setAccountFilterRange,
  setAccountFilterTypes,
  setupAccountBills,
} from '@/store/slices/billing';
import { Flex, Text } from '@node-real/uikit';
import { useUpdateEffect } from 'ahooks';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { stringify } from 'querystring';
import { FilterContainer } from './Common';
import { FilterDateRange } from './FilterDateRange';
import { FilterTypes } from './FilterTypes';
import { DCButton } from '@/components/common/DCButton';
import { IconFont } from '@/components/IconFont';

export const AccountBillingHistoryFilter = ({ address }: { address: string }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { query } = router;
  const accountBillRangeFilter = useAppSelector((root) => root.billing.accountBillRangeFilter);
  const accountBillTypeFilter = useAppSelector((root) => root.billing.accountBillTypeFilter);

  useUpdateEffect(() => {
    if (!accountBillRangeFilter || (!accountBillRangeFilter[0] && !accountBillRangeFilter[1])) {
      delete query.from;
      delete query.to;
    } else {
      query.from = dayjs(accountBillRangeFilter[0]).format('YYYY-MM-DD');
      query.to = dayjs(accountBillRangeFilter[1] || new Date()).format('YYYY-MM-DD');
    }
    query.page = '1';
    const url = router.pathname.replace('[address]', router.query.address as string);
    router.push(`${url}?${stringify(query)}`, undefined, {
      scroll: false,
    });
  }, [(accountBillRangeFilter || []).join('')]);

  useUpdateEffect(() => {
    if (!accountBillTypeFilter) {
      delete query.type;
    } else {
      query.type = accountBillTypeFilter;
    }
    query.page = '1';
    const url = router.pathname.replace('[address]', router.query.address as string);
    router.push(`${url}?${stringify(query)}`, undefined, {
      scroll: false,
    });
  }, [accountBillTypeFilter?.join('')]);

  const onRefresh = () => {
    dispatch(setupAccountBills(address));
  };

  return (
    <Flex justifyContent={'space-between'} alignItems={'center'} gap={12}>
      <Text fontSize={16} fontWeight={600} flex={1}>
        Billing History
      </Text>
      <DCButton
        variant="ghost"
        alignItems={'center'}
        onClick={onRefresh}
        paddingLeft={6}
        leftIcon={<IconFont type="refresh" w={24} />}
      />
      <FilterContainer>
        <FilterDateRange
          filterDateRange={accountBillRangeFilter}
          onSetFilterDateRange={(range) => dispatch(setAccountFilterRange(range))}
        />
        <FilterTypes
          filterTypes={accountBillTypeFilter}
          onSetFilterTypes={(types) => dispatch(setAccountFilterTypes(types))}
        />
      </FilterContainer>
    </Flex>
  );
};
