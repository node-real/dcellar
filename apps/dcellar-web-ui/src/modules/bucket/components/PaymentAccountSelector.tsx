import { MenuOption } from '@/components/common/DCMenuList';
import { DCSelect } from '@/components/common/DCSelect';
import { useAppSelector } from '@/store';
import { AccountEntity, selectPaymentAccounts } from '@/store/slices/accounts';
import { trimLongStr } from '@/utils/string';
import { Box, Grid, Text } from '@node-real/uikit';
import { useMount } from 'ahooks';
import { keyBy } from 'lodash-es';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { memo } from 'react';

interface PaymentAccountSelectorProps {
  onChange: (value: AccountEntity) => void;
}

export const PaymentAccountSelector = memo<PaymentAccountSelectorProps>(
  function PaymentAccountSelector(props) {
    const router = useRouter();
    const ownerAccount = useAppSelector((root) => root.accounts.ownerAccount);
    const loginAccount = useAppSelector((root) => root.persist.loginAccount);
    const paymentAccounts = useAppSelector(selectPaymentAccounts(loginAccount));

    const [paymentAccount, setPaymentAccount] = useState({} as AccountEntity);
    const [accountCount, setAccountCount] = useState(0);

    const accountList = useMemo(
      () => [ownerAccount, ...(paymentAccounts || [])],
      [paymentAccounts, ownerAccount],
    );
    const len = accountList.length;
    const keyAccountList = keyBy(accountList, 'address');
    const { onChange } = props;
    const saveOnChangeRef = useRef(onChange);
    saveOnChangeRef.current = onChange;

    const options = useMemo(
      () =>
        accountList.map((item) => {
          const { address, name } = item;
          return {
            label: name,
            value: address,
          };
        }),
      [accountList],
    );

    const renderOption = ({ label, value }: MenuOption) => {
      return <OptionItem label={label} value={value} />;
    };

    const renderFooter = useCallback(() => {
      return (
        <Grid borderTop={'1px solid readable.border'} h={33} placeItems="center">
          <Link href="/accounts" passHref legacyBehavior>
            <Text
              fontWeight={500}
              as="a"
              color="brand.normal"
              _hover={{ color: 'brand.brand5' }}
              onMouseDown={() => router.push('/accounts')}
            >
              Manage Accounts
            </Text>
          </Link>
        </Grid>
      );
    }, [router]);

    const onPaymentAccountChange = (value: string) => {
      setPaymentAccount(keyAccountList[value]);
    };

    const onSearch = (result: MenuOption[]) => {
      setAccountCount(result.length);
    };

    const onSearchFilter = (keyword: string, item: MenuOption) => {
      const tmpKeyword = keyword.toLowerCase();
      const tmpValue = item.value.toLowerCase();
      const tmpName = (item.label as string).toLowerCase();
      return tmpValue.includes(tmpKeyword) || tmpName.includes(tmpKeyword);
    };

    useMount(() => {
      if (!len) return;
      setAccountCount(len);
      setPaymentAccount(accountList[0]);
    });

    useEffect(() => {
      if (!paymentAccount.address) return;
      saveOnChangeRef.current?.(paymentAccount);
    }, [paymentAccount]);

    return (
      <DCSelect
        value={paymentAccount.address}
        text={renderItem(paymentAccount.name, paymentAccount.address)}
        options={options}
        header={() => `Accounts (${accountCount})`}
        onChange={onPaymentAccountChange}
        onSearchFilter={onSearchFilter}
        onSearch={onSearch}
        renderOption={renderOption}
        footer={renderFooter}
        itemProps={{
          gaClickName: 'dc.bucket.create_modal.select_sp.click',
        }}
      />
    );
  },
);

const renderItem = (moniker: string, address: string) => {
  return [moniker, trimLongStr(address, 10, 6, 4)].filter(Boolean).join(' | ');
};

function OptionItem(props: MenuOption) {
  const { value, label } = props;

  return (
    <Box key={value} display="flex" flexDir="column" alignItems="flex-start" gap={2}>
      <Text fontSize={14} color="readable.top.secondary" noOfLines={1}>
        {label}
      </Text>
      <Text color={'readable.tertiary'} fontSize={12}>
        {value}
      </Text>
    </Box>
  );
}
