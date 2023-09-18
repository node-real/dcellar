import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, Loading, Text } from '@totejs/uikit';
import { IDCSelectOption } from '@/components/common/DCSelect';
import { useAppSelector } from '@/store';
import { useRouter } from 'next/router';
import { keyBy } from 'lodash-es';
import { selectPaymentAccounts, TAccount } from '@/store/slices/accounts';
import { DCInputSelect } from '@/components/common/DCInputSelect';
import { MenuCloseIcon } from '@totejs/icons';
import { getAccountDisplay } from '@/utils/accounts';
import { AccountTips } from './AccountTips';

type TProps = {
  value: string;
  loading: boolean;
  isError: boolean;
  disabled?: boolean;
  onChange: (value: TAccount) => void;
};

export function ToAccountSelector({ onChange, value, loading, isError, disabled = false }: TProps) {
  const router = useRouter();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const paymentAccounts = useAppSelector(selectPaymentAccounts(loginAccount));
  const { accountTypes } = useAppSelector((state) => state.accounts);
  const accountList = useMemo(
    () => [{ name: 'Owner Account', address: loginAccount }, ...(paymentAccounts || [])],
    [loginAccount, paymentAccounts],
  );
  const keyAccountList = keyBy(accountList, 'address');
  const len = accountList?.length;
  const [account, setAccount] = useState({} as TAccount);
  const [total, setTotal] = useState(0);
  const saveOnChangeRef = useRef(onChange);
  saveOnChangeRef.current = onChange;

  useEffect(() => {
    if (!len) return;
    setTotal(len);
  }, [len]);

  useEffect(() => {
    if (account.address === value || !value) return;
    const initialAccount = accountList.find((item) => item.address === value);
    setAccount(initialAccount || { name: 'Custom Account', address: value });
  }, [accountList, value]);

  useEffect(() => {
    if (!account) return;
    saveOnChangeRef.current?.(account);
  }, [account]);

  const onChangeAccount = (value: string) => {
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
      accountList
        .map((item) => {
          const { name, address } = item;
          return {
            label: <OptionItem address={address} name={name} />,
            value: address,
            name,
          };
        })
        .filter((item) => item.value !== loginAccount),
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
        bgColor: 'bg.bottom',
      }}
      onClick={() => {
        router.push('/accounts');
      }}
    >
      Manage Accounts
    </Flex>
  );

  const RightIcon = () => {
    if (loading) {
      return <Loading size={12} marginX={4} color="readable.normal" />;
    }
    const accountType = isError ? 'error_account' : accountTypes[value];
    const accountDisplay = getAccountDisplay(accountType);
    return accountDisplay ? <AccountTips type={accountType} /> : <MenuCloseIcon />;
  };

  return (
    <DCInputSelect
      isDisabled={disabled}
      RightIcon={RightIcon}
      value={account?.address}
      text={account?.address}
      placeholder="Choose or enter addresses"
      options={options}
      header={`Accounts (${total})`}
      onChange={onChangeAccount}
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
