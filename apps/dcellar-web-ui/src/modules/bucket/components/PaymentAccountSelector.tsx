import { MenuOption } from '@/components/common/DCMenuList';
import { DCSelect } from '@/components/common/DCSelect';
import { useAppSelector } from '@/store';
import { TAccount, selectPaymentAccounts } from '@/store/slices/accounts';
import { trimLongStr } from '@/utils/string';
import { Box, Grid, Text } from '@node-real/uikit';
import { useMount } from 'ahooks';
import { keyBy } from 'lodash-es';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  onChange: (value: TAccount) => void;
};

export function PaymentAccountSelector(props: Props) {
  const router = useRouter();
  const { ownerAccount } = useAppSelector((root) => root.accounts);
  const { loginAccount } = useAppSelector((root) => root.persist);
  const paymentAccounts = useAppSelector(selectPaymentAccounts(loginAccount));
  const accountList = useMemo(
    () => [ownerAccount, ...(paymentAccounts || [])],
    [paymentAccounts, ownerAccount],
  );
  const len = accountList.length;
  const keyAccountList = keyBy(accountList, 'address');
  const [pa, setPA] = useState({} as TAccount);
  const [total, setTotal] = useState(0);
  const { onChange } = props;
  const saveOnChangeRef = useRef(onChange);
  saveOnChangeRef.current = onChange;

  useMount(() => {
    if (!len) return;
    setTotal(len);
    setPA(accountList[0]);
  });

  useEffect(() => {
    if (!pa.address) return;
    saveOnChangeRef.current?.(pa);
  }, [pa]);

  const onChangePA = (value: string) => {
    setPA(keyAccountList[value]);
  };

  const onSearch = (result: MenuOption[]) => {
    setTotal(result.length);
  };

  const onSearchFilter = (keyword: string, item: MenuOption) => {
    const tmpKeyword = keyword.toLowerCase();
    const tmpValue = item.value.toLowerCase();
    const tmpName = (item.label as string).toLowerCase();
    return tmpValue.includes(tmpKeyword) || tmpName.includes(tmpKeyword);
  };

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
  }, []);

  return (
    <DCSelect
      value={pa.address}
      text={renderItem(pa.name, pa.address)}
      options={options}
      header={() => `Accounts (${total})`}
      onChange={onChangePA}
      onSearchFilter={onSearchFilter}
      onSearch={onSearch}
      renderOption={renderOption}
      footer={renderFooter}
      itemProps={{
        gaClickName: 'dc.bucket.create_modal.select_sp.click',
      }}
    />
  );
}

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
