import { Box, Grid, Text } from '@node-real/uikit';
import { keyBy } from 'lodash-es';
import Link from 'next/link';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { MenuOption } from '@/components/common/DCMenuList';
import { DCSelect } from '@/components/common/DCSelect';
import { OWNER_ACCOUNT_NAME } from '@/constants/wallet';
import { useAppSelector } from '@/store';
import { AccountEntity, selectPaymentAccounts } from '@/store/slices/accounts';
import { getShortAccountName } from '@/utils/billing';
import { trimLongStr } from '@/utils/string';

interface FromAccountSelectorProps {
  onChange: (value: AccountEntity) => void;
  from: string;
}

export const FromAccountSelector = memo<FromAccountSelectorProps>(
  function FromAccountSelector(props) {
    const { onChange, from } = props;
    const loginAccount = useAppSelector((root) => root.persist.loginAccount);
    const paymentAccounts = useAppSelector(selectPaymentAccounts(loginAccount));

    const [account, setAccount] = useState({} as AccountEntity);
    const [total, setTotal] = useState(0);
    const saveOnChangeRef = useRef(onChange);

    saveOnChangeRef.current = onChange;

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

    const options = useMemo(
      () =>
        accountList.map((item) => {
          const { name, address } = item;
          return {
            label: name,
            value: address,
            name,
          };
        }),
      [accountList],
    );

    const onChangeAccount = (value: string) => {
      setAccount(keyAccountList[value]);
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

    useEffect(() => {
      if (!len) return;
      setTotal(len);
      const initialAccount = accountList.find((item) => item.address === from);
      setAccount(initialAccount || accountList[0]);
      saveOnChangeRef.current?.(account);
    }, [from, accountList]);

    useEffect(() => {
      if (!account) return;
      saveOnChangeRef.current?.(account);
    }, [account]);

    const Footer = () => (
      <Grid borderTop={'1px solid readable.border'} h={33} placeItems="center">
        <Link href="/accounts" passHref legacyBehavior>
          <Text fontWeight={500} as="a" color="brand.normal" _hover={{ color: 'brand.brand5' }}>
            Manage Accounts
          </Text>
        </Link>
      </Grid>
    );

    return (
      <DCSelect
        value={account?.address}
        text={renderItem(account?.name, account?.address)}
        options={options}
        header={() => `Accounts (${total})`}
        onChange={onChangeAccount}
        onSearchFilter={onSearchFilter}
        onSearch={onSearch}
        itemProps={{
          gaClickName: 'dc.bucket.create_modal.select_sp.click',
        }}
        footer={Footer}
        renderOption={({ value, label }) => <OptionItem value={value} label={label} />}
      />
    );
  },
);
const renderItem = (name: string, address: string) => {
  return [name, trimLongStr(address, 10, 6, 4)].filter(Boolean).join(' | ');
};

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
      {/* {name && (
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
          {endpoint}
        </Text> */}
      {/* )} */}
    </Box>
  );
}
