import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text } from '@totejs/uikit';
import { IDCSelectOption, Select } from '@/components/common/DCSelect';
import { trimLongStr } from '@/utils/string';
import { useAppSelector } from '@/store';
import { useMount } from 'ahooks';
import { SpItem } from '@/store/slices/sp';

interface SPSelector {
  onChange: (value: SpItem) => void;
}

export function SPSelector(props: SPSelector) {
  const { sps, spInfo, oneSp } = useAppSelector((root) => root.sp);
  const len = sps.length;
  const [sp, setSP] = useState({} as SpItem);
  const [total, setTotal] = useState(0);
  const { onChange } = props;
  const saveOnChangeRef = useRef(onChange);
  saveOnChangeRef.current = onChange;

  useMount(() => {
    if (!len) return;
    setTotal(len);
    setSP(spInfo[oneSp]);
  });

  useEffect(() => {
    if (!sp.operatorAddress) return;
    saveOnChangeRef.current?.(sp);
  }, [sp]);

  const onChangeSP = (value: string) => {
    setSP(spInfo[value]);
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
      sps.map((item) => {
        const { operatorAddress, moniker: name, endpoint } = item;
        return {
          label: <OptionItem address={operatorAddress} name={name} endpoint={endpoint} />,
          value: operatorAddress,
          name,
          endpoint: item.endpoint,
        };
      }),
    [sps],
  );

  return (
    <Select
      value={sp.operatorAddress}
      text={renderItem(sp.moniker, sp.operatorAddress)}
      options={options}
      header={`Primary Storage Provider (${total})`}
      onChange={onChangeSP}
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
