import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text } from '@totejs/uikit';
import { IDCSelectOption, Select } from '@/components/common/DCSelect';
import { trimLongStr } from '@/utils/string';
import { useAppSelector } from '@/store';
import { useMount } from 'ahooks';
import { TAccount } from '@/store/slices/accounts';
import { keyBy } from 'lodash-es';

type Props =  {
  onChange: (value: TAccount) => void;
}

export function PaymentAccountSelector(props: Props) {
  const { isLoadingDetail, PAList, ownerAccount } = useAppSelector((root) => root.accounts);
  const accountList = useMemo(() => ([ownerAccount, ...PAList]), [PAList, ownerAccount]);
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
        const { address, name } = item;
        return {
          label: <OptionItem address={address} name={name} />,
          value: address,
          name,
        };
      }),
    [accountList],
  );

  return (
    <Select
      value={pa.address}
      text={renderItem(pa.name, pa.address)}
      options={options}
      header={`Accounts (${total})`}
      onChange={onChangePA}
      onSearchFilter={onSearchFilter}
      onSearch={onSearch}
      itemProps={{
        gaClickName: 'dc.bucket.create_modal.select_sp.click',
      }}
    />
  );
}

const renderItem = (moniker: string, address: string) => {
  return [moniker, trimLongStr(address, 10, 6, 4)].filter(Boolean).join(' | ');
};

function OptionItem(props: any) {
  const { address, name, endpoint } = props;

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
        {renderItem(name, address)}
      </Text>
      {name && (
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
        </Text>
      )}
    </Box>
  );
}
