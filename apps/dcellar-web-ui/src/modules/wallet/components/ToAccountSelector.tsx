import { MenuCloseIcon } from '@node-real/icons';
import { Box, Grid, Loading, Text } from '@node-real/uikit';
import { keyBy } from 'lodash-es';
import Link from 'next/link';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AccountTips } from './AccountTips';
import { DCInputSelect } from '@/components/common/DCInputSelect';
import { MenuOption } from '@/components/common/DCMenuList';
import { OWNER_ACCOUNT_NAME } from '@/constants/wallet';
import { useAppSelector } from '@/store';
import { AccountEntity, selectPaymentAccounts } from '@/store/slices/accounts';
import { getAccountDisplay } from '@/utils/accounts';
import { getShortAccountName } from '@/utils/billing';

interface ToAccountSelectorProps {
  value: string;
  loading: boolean;
  isError: boolean;
  disabled?: boolean;
  onChange: (value: AccountEntity) => void;
}

export const ToAccountSelector = memo<ToAccountSelectorProps>(function ToAccountSelector({
  onChange,
  value,
  loading,
  isError,
  disabled = false,
}) {
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const accountTypeRecords = useAppSelector((root) => root.accounts.accountTypeRecords);

  const paymentAccounts = useAppSelector(selectPaymentAccounts(loginAccount));
  const [account, setAccount] = useState({} as AccountEntity);
  const [total, setTotal] = useState(0);
  const saveOnChangeRef = useRef(onChange);

  const accountList = useMemo(
    () => [
      {
        name: OWNER_ACCOUNT_NAME,
        address: loginAccount,
        id: getShortAccountName(OWNER_ACCOUNT_NAME),
      },
      ...(paymentAccounts || []),
    ],
    [loginAccount, paymentAccounts],
  );
  const keyAccountList = keyBy(accountList, 'address');
  const len = accountList?.length;
  saveOnChangeRef.current = onChange;

  const options = useMemo(
    () =>
      accountList
        .map((item) => {
          const { name, address } = item;
          return {
            label: name,
            value: address,
          };
        })
        .filter((item) => item.value !== loginAccount),
    [accountList],
  );

  const onChangeAccount = (value: string) => {
    setAccount(
      keyAccountList[value] || {
        name: 'Custom Account',
        address: value,
      },
    );
  };

  const onSearch = (result: any[]) => {
    setTotal(result?.length);
  };

  const onSearchFilter = (keyword: string, item: MenuOption) => {
    const tmpKeyword = keyword.toLowerCase();
    const tmpValue = item.value.toLowerCase();
    const tmpName = (item.label as string).toLowerCase();
    return tmpValue.includes(tmpKeyword) || tmpName.includes(tmpKeyword);
  };

  const Footer = () => (
    <Grid borderTop={'1px solid readable.border'} h={33} placeItems="center">
      <Link href="/accounts" passHref legacyBehavior>
        <Text fontWeight={500} as="a" color="brand.normal" _hover={{ color: 'brand.brand5' }}>
          Manage Accounts
        </Text>
      </Link>
    </Grid>
  );

  const RightIcon = () => {
    if (loading) {
      return <Loading size={12} marginX={4} color="readable.normal" />;
    }
    const accountType = isError ? 'error_account' : accountTypeRecords[value];
    const accountDisplay = getAccountDisplay(accountType);
    return accountDisplay ? <AccountTips type={accountType} /> : <MenuCloseIcon />;
  };

  useEffect(() => {
    if (!len) return;
    setTotal(len);
  }, [len]);

  useEffect(() => {
    if (account.address === value || !value) return;
    const initialAccount = accountList.find((item) => item.address === value);
    setAccount(initialAccount || { name: 'Custom Account', address: value, id: 'CA' });
  }, [accountList, value]);

  useEffect(() => {
    if (!account) return;
    saveOnChangeRef.current?.(account);
  }, [account]);

  return (
    <DCInputSelect
      isDisabled={disabled}
      RightIcon={() => <Box onClick={(e) => e.stopPropagation()}>{RightIcon()}</Box>}
      value={account?.address}
      text={account?.address}
      placeholder="Choose or enter addresses"
      options={options}
      header={() => `Payment Accounts (${total})`}
      onChange={onChangeAccount}
      onSearchFilter={onSearchFilter}
      onSearch={onSearch}
      itemProps={{
        gaClickName: 'dc.bucket.create_modal.select_sp.click',
      }}
      footer={Footer}
      renderOption={({ value, label }) => <OptionItem value={value} label={label} />}
      emptyIcon="empty-account"
      emptyText="No Payment Accounts"
    />
  );
});

function OptionItem(props: MenuOption) {
  const { value: address, label: name } = props;

  return (
    <Box key={address} display="flex" flexDir="column" alignItems="flex-start" whiteSpace="normal">
      <Text
        fontSize={16}
        lineHeight="19px"
        fontWeight={400}
        w="100%"
        color="readable.top.secondary"
        noOfLines={1}
      >
        {name}
      </Text>
      <Text
        mt={2}
        fontSize={12}
        transformOrigin="0 50%"
        transform={'scale(0.85)'}
        lineHeight="18px"
        fontWeight={400}
        color="readable.secondary"
        noOfLines={1}
      >
        {address}
      </Text>
    </Box>
  );
}
