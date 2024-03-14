import { useAppDispatch, useAppSelector } from '@/store';
import { setAccountFilterRange, setAccountFilterTypes } from '@/store/slices/billing';
import { Flex, Text } from '@node-real/uikit';
import { useUpdateEffect } from 'ahooks';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { stringify } from 'querystring';
import { FilterContainer } from './Common';
import { FilterDateRange } from './FilterDateRange';
import { FilterTypes } from './FilterTypes';

export const AccountBillingHistoryFilter = () => {
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

  return (
    <Flex justifyContent={'space-between'} alignItems={'center'}>
      <Text fontSize={16} fontWeight={600}>
        Billing History
      </Text>
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
