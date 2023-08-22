import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, Text } from '@totejs/uikit';
import { IDCSelectOption, DCSelect } from '@/components/common/DCSelect';
import { trimLongStr } from '@/utils/string';
import { useAppSelector } from '@/store';
import { useMount } from 'ahooks';
import { SpItem } from '@/store/slices/sp';
import { useRouter } from 'next/router';
import { keyBy } from 'lodash-es';
import { TAccount } from '@/store/slices/accounts';
import { DCInputSelect } from '@/components/common/DCInputSelect';

type TProps = {
  onChange: (value: TAccount) => void;
  to: string;
};

export function ToAccountSelector({ onChange, to }: TProps) {
  const router = useRouter();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { PAList } = useAppSelector((root) => root.accounts);

  const accountList = useMemo(
    () => [{ name: 'Owner Account', address: loginAccount }, ...PAList],
    [loginAccount, PAList],
  );
  const keyAccountList = keyBy(accountList, 'address');
  const len = accountList?.length;
  const [account, setAccount] = useState({} as TAccount);
  const [total, setTotal] = useState(0);
  const saveOnChangeRef = useRef(onChange);
  saveOnChangeRef.current = onChange;

  useMount(() => {
    if (!len) return;
    const initialAccount = accountList.find((item) => item.address === to);
    setTotal(len);
    setAccount(initialAccount || { name: 'Custom Account', address: '' });
  });

  useEffect(() => {
    if (!account) return;
    saveOnChangeRef.current?.(account);
  }, [account]);

  const onChangeSP = (value: string) => {
    setAccount(
      keyAccountList[value] || {
        name: 'Custom Account',
        address: value,
      },
    );
  };

  const onSearch = (result: IDCSelectOption[]) => {
    setTotal(result?.length);
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
      onClick={() => {
        router.push('/accounts');
      }}
    >
      Manage Account
    </Flex>
  );
  return (
    <DCInputSelect
      value={account?.address}
      text={account?.address}
      placeholder="Choose or enter addresses"
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
    </Box>
  );
}
