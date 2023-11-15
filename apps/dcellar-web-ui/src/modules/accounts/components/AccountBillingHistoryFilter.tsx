import { Flex, Text } from '@totejs/uikit';
import dayjs from 'dayjs';
import { setAccountFilterRange, setAccountFilterTypes } from '@/store/slices/billing';
import { useAppDispatch, useAppSelector } from '@/store';
import { FilterContainer } from './Common';
import { FilterTypes } from './FilterTypes';
import { useUpdateEffect } from 'ahooks';
import { useRouter } from 'next/router';
import { stringify } from 'querystring';
import { FilterDateRange } from './FilterDateRange';

export const AccountBillingHistoryFilter = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { query } = router;
  const accountFilterRange = useAppSelector((root) => root.billing.accountFilterRange);
  const accountFilterTypes = useAppSelector((root) => root.billing.accountFilterTypes);

  useUpdateEffect(() => {
    if (!accountFilterRange || (!accountFilterRange[0] && !accountFilterRange[1])) {
      delete query.from;
      delete query.to;
    } else {
      query.from = dayjs(accountFilterRange[0]).format('YYYY-MM-DD');
      query.to = dayjs(accountFilterRange[1] || new Date()).format('YYYY-MM-DD');
    }
    query.page = '1';
    const url = router.pathname.replace('[address]', router.query.address as string);
    router.push(`${url}?${stringify(query)}`, undefined, {
      scroll: false,
    });
  }, [(accountFilterRange || []).join('')]);

  useUpdateEffect(() => {
    if (!accountFilterTypes) {
      delete query.type;
    } else {
      query.type = accountFilterTypes;
    }
    query.page = '1';
    const url = router.pathname.replace('[address]', router.query.address as string);
    router.push(`${url}?${stringify(query)}`, undefined, {
      scroll: false,
    });
  }, [accountFilterTypes?.join('')]);

  return (
    <Flex justifyContent={'space-between'} alignItems={'center'}>
      <Text fontSize={16} fontWeight={600}>
        Billing History
      </Text>
      <FilterContainer>
        <FilterDateRange
          filterDateRange={accountFilterRange}
          onSetFilterDateRange={(range) => dispatch(setAccountFilterRange(range))}
        />
        <FilterTypes
          filterTypes={accountFilterTypes}
          onSetFilterTypes={(types) => dispatch(setAccountFilterTypes(types))}
        />
      </FilterContainer>
    </Flex>
  );
};
