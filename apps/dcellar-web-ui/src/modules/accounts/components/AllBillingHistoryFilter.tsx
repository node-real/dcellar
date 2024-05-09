import { InternalRoutePaths } from '@/constants/paths';
import { useAppDispatch, useAppSelector } from '@/store';
import { setAllFilterRange, setAllFilterTypes, setupAllBills } from '@/store/slices/billing';
import { Flex, Text } from '@node-real/uikit';
import { useUpdateEffect } from 'ahooks';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { stringify } from 'querystring';
import { FilterContainer } from './Common';
import { FilterAccounts } from './FilterAccounts';
import { FilterDateRange } from './FilterDateRange';
import { FilterTypes } from './FilterTypes';
import { DCButton } from '@/components/common/DCButton';
import { IconFont } from '@/components/IconFont';

export const AllBillingHistoryFilter = () => {
  const dispatch = useAppDispatch();
  const allFilterAccounts = useAppSelector((root) => root.billing.billAccountFilter);

  const router = useRouter();
  const { query } = router;
  const billRangeFilter = useAppSelector((root) => root.billing.billRangeFilter);
  const billTypeFilter = useAppSelector((root) => root.billing.billTypeFilter);

  useUpdateEffect(() => {
    if (query.tab === 'a') return;
    query.address = allFilterAccounts;
    query.page = '1';
    router.push(`${InternalRoutePaths.accounts}?${stringify(query)}`, undefined, {
      scroll: false,
    });
  }, [allFilterAccounts.join('')]);

  useUpdateEffect(() => {
    if (query.tab === 'a') return;
    if (!billRangeFilter || (!billRangeFilter[0] && !billRangeFilter[1])) {
      delete query.from;
      delete query.to;
    } else {
      query.from = dayjs(billRangeFilter[0]).format('YYYY-MM-DD');
      query.to = billRangeFilter[1] ? dayjs(billRangeFilter[1]).format('YYYY-MM-DD') : '';
    }
    query.page = '1';
    router.push(`${InternalRoutePaths.accounts}?${stringify(query)}`, undefined, {
      scroll: false,
    });
  }, [(billRangeFilter || []).join('')]);

  useUpdateEffect(() => {
    if (query.tab === 'a') return;
    if (!billTypeFilter) {
      delete query.type;
    } else {
      query.type = billTypeFilter;
    }
    query.page = '1';
    router.push(`${InternalRoutePaths.accounts}?${stringify(query)}`, undefined, {
      scroll: false,
    });
  }, [billTypeFilter?.join('')]);

  const onRefresh = () => {
    dispatch(setupAllBills());
  };

  return (
    <Flex justifyContent={'space-between'} mt={16} alignItems={'center'} gap={12}>
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
          filterDateRange={billRangeFilter}
          onSetFilterDateRange={(dateRange) => dispatch(setAllFilterRange(dateRange))}
        />
        <FilterAccounts />
        <FilterTypes
          filterTypes={billTypeFilter}
          onSetFilterTypes={(types) => dispatch(setAllFilterTypes(types))}
        />
      </FilterContainer>
    </Flex>
  );
};
