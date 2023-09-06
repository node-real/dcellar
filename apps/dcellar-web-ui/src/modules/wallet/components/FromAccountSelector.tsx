import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, Text } from '@totejs/uikit';
import { IDCSelectOption, DCSelect } from '@/components/common/DCSelect';
import { trimLongStr } from '@/utils/string';
import { useAppSelector } from '@/store';
import { useRouter } from 'next/router';
import { keyBy } from 'lodash-es';
import { TAccount, selectPaymentAccounts } from '@/store/slices/accounts';

type TAccountSelector = {
  onChange: (value: TAccount) => void;
  from: string;
};

export function FromAccountSelector(props: TAccountSelector) {
  const router = useRouter();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const paymentAccounts= useAppSelector(selectPaymentAccounts(loginAccount));
  const accountList = useMemo(
    () => [{ name: 'Owner Account', address: loginAccount }, ...(paymentAccounts || [])],
    [loginAccount, paymentAccounts],
  );
  const keyAccountList = keyBy(accountList, 'address');
  const len = accountList?.length;
  const [account, setAccount] = useState({} as TAccount);
  const [total, setTotal] = useState(0);
  const { onChange, from } = props;
  const saveOnChangeRef = useRef(onChange);
  saveOnChangeRef.current = onChange;

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

  const onChangeSP = (value: string) => {
    setAccount(keyAccountList[value]);
  };

  const onSearch = (result: IDCSelectOption[]) => {
    setTotal(result.length);
  };

  const onSearchFilter = (keyword: string, item: IDCSelectOption) => {
    const tmpKeyword = keyword.toLowerCase();
    const tmpValue = item.value.toLowerCase();
    const tmpName = item.name.toLowerCase();
    return tmpValue.includes(tmpKeyword) || tmpName.includes(tmpKeyword);
  };

  const options = useMemo(
    () =>
      accountList.map((item) => {
        const { name, address } = item;
        return {
          label: <OptionItem address={address} name={name} />,
          value: address,
          name,
        };
      }),
    [accountList],
  );

  const Footer = () => (
    <Flex
      height={39}
      borderTop={'1px solid readable.border'}
      textAlign={'center'}
      color="readable.brand5"
      fontSize={14}
      fontWeight={500}
      alignItems={'center'}
      justifyContent={'center'}
      cursor={'pointer'}
      _hover={{
        bgColor: 'bg.bottom'
      }}
      onClick={() => {
        router.push('/accounts');
      }}
    >
      Manage Accounts
    </Flex>
  );

  return (
    <DCSelect
      value={account?.address}
      text={renderItem(account?.name, account?.address)}
      options={options}
      header={`Accounts (${total})`}
      onChange={onChangeSP}
      onSearchFilter={onSearchFilter}
      onSearch={onSearch}
      itemProps={{
        gaClickName: 'dc.bucket.create_modal.select_sp.click',
      }}
      Footer={Footer}
    />
  );
}
const renderItem = (name: string, address: string) => {
  return [name, trimLongStr(address, 10, 6, 4)].filter(Boolean).join(' | ');
};

function OptionItem(props: any) {
  const { address, name } = props;

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
