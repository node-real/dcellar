import { Flex, Text } from '@node-real/uikit';
import dayjs from 'dayjs';
import { setAllFilterRange, setAllFilterTypes } from '@/store/slices/billing';
import { useAppDispatch, useAppSelector } from '@/store';
import { FilterContainer } from './Common';
import { useRouter } from 'next/router';
import { InternalRoutePaths } from '@/constants/paths';
import { stringify } from 'querystring';
import { useUpdateEffect } from 'ahooks';
import { FilterAccounts } from './FilterAccounts';
import { FilterTypes } from './FilterTypes';
import { FilterDateRange } from './FilterDateRange';

export const AllBillingHistoryFilter = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { query } = router;
  const allFilterRange = useAppSelector((root) => root.billing.allFilterRange);
  const allFilterAccounts = useAppSelector((root) => root.billing.allFilterAccounts);
  const allFilterTypes = useAppSelector((root) => root.billing.allFilterTypes);

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
    if (!allFilterRange || (!allFilterRange[0] && !allFilterRange[1])) {
      delete query.from;
      delete query.to;
    } else {
      query.from = dayjs(allFilterRange[0]).format('YYYY-MM-DD');
      query.to = allFilterRange[1] ? dayjs(allFilterRange[1]).format('YYYY-MM-DD') : ''
    }
    query.page = '1';
    router.push(`${InternalRoutePaths.accounts}?${stringify(query)}`, undefined, {
      scroll: false,
    });
  }, [(allFilterRange || []).join('')]);
  useUpdateEffect(() => {
    if (query.tab === 'a') return;
    if (!allFilterTypes) {
      delete query.type;
    } else {
      query.type = allFilterTypes;
    }
    query.page = '1';
    router.push(`${InternalRoutePaths.accounts}?${stringify(query)}`, undefined, {
      scroll: false,
    });
  }, [allFilterTypes?.join('')]);

  return (
    <Flex justifyContent={'space-between'} mt={16} alignItems={'center'}>
      <Text fontSize={16} fontWeight={600}>
        Billing History
      </Text>
      <FilterContainer>
        <FilterDateRange
          filterDateRange={allFilterRange}
          onSetFilterDateRange={(dateRange) => dispatch(setAllFilterRange(dateRange))}
        />
        <FilterAccounts />
        <FilterTypes
          filterTypes={allFilterTypes}
          onSetFilterTypes={(types) => dispatch(setAllFilterTypes(types))}
        />
      </FilterContainer>
    </Flex>
  );
};
