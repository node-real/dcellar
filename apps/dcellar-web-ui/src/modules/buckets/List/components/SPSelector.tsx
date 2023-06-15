import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Text } from '@totejs/uikit';

import { IDCSelectOption, Select } from '@/components/common/DCSelect';
import { trimLongStr } from '@/utils/string';
import { useSaveFuncRef } from '@/hooks/useSaveFuncRef';
import { useSPs } from '@/hooks/useSPs';
import { IRawSPInfo } from '../../type';

interface SPSelector {
  onChange: (value: IRawSPInfo) => void;
}

export function SPSelector(props: SPSelector) {
  const { onChange } = props;

  const { sps: globalSps } = useSPs();

  const finalSPs = useMemo<IRawSPInfo[]>(() => {
    const sps: IRawSPInfo[] =
      globalSps.filter((v: IRawSPInfo) => v?.description?.moniker !== 'QATest') ?? [];

    return sps.sort((a, b) => {
      const nameA = a.description?.moniker;
      const nameB = b.description?.moniker;

      if (nameA && nameB) {
        return nameA < nameB ? -1 : 1;
      }
      if (!nameA && !nameB) {
        return a.operatorAddress < b.operatorAddress ? -1 : 1;
      }
      if (nameA) return -1;
      if (nameB) return 1;

      return 0;
    });
  }, [globalSps]);

  const [sp, setSP] = useState<IRawSPInfo>();
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const len = finalSPs.length;
    const index = ~~(Math.random() * len);

    setSP(finalSPs[index]);
    setTotal(len);
  }, [finalSPs]);

  const saveOnChangeRef = useSaveFuncRef(onChange);
  useEffect(() => {
    saveOnChangeRef.current?.(sp as IRawSPInfo);
  }, [saveOnChangeRef, sp]);

  const onChangeSP = useCallback(
    (value: string) => {
      const target = finalSPs.find((item: IRawSPInfo) => item.operatorAddress === value);
      if (target) {
        setSP(target);
      }
    },
    [finalSPs],
  );

  const onSearchFilter = useCallback((keyword: string, item: IDCSelectOption) => {
    const tmpKeyword = keyword.toLowerCase();
    const tmpValue = item.value.toLowerCase();
    const tmpName = item.name.toLowerCase();
    return tmpValue.includes(tmpKeyword) || tmpName.includes(tmpKeyword);
  }, []);

  const onSearch = useCallback((result: IDCSelectOption[]) => {
    setTotal(result.length);
  }, []);

  const { text, value } = useTextAndValue(sp);

  const options = useMemo(() => {
    return finalSPs.map((item) => {
      const { operatorAddress, name, endpoint } = getNameAndAddress(item);
      return {
        label: <OptionItem address={operatorAddress} name={name}  endpoint={endpoint} />,
        value: operatorAddress,
        name,
        endpoint: item.endpoint,
      };
    });
  }, [finalSPs]);

  return (
    <Select
      value={value}
      text={text}
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

function getNameAndAddress(item: any = {}) {
  return {
    operatorAddress: item?.operatorAddress ?? '',
    name: item?.description?.moniker ?? '',
    endpoint: item?.endpoint ?? '',
  };
}

function useTextAndValue(item: any) {
  const [value, setValue] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    const { operatorAddress, name } = getNameAndAddress(item);
    setValue(operatorAddress);

    const addr = trimLongStr(operatorAddress, 10, 6, 4);
    if (name && operatorAddress) {
      setText(`${name} | ${addr}`);
    } else if (name || operatorAddress) {
      setText(`${name || addr}`);
    } else {
      setText('');
    }
  }, [item]);

  return {
    value,
    text,
  };
}

function OptionItem(props: any) {
  const { address, name, endpoint } = props;
  const renderAddress = trimLongStr(address, 10, 6, 4);

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
        {`${name} | ${renderAddress}`}
      </Text>
      {name && (
        <Text
          mt={2}
          fontSize={12}
          transformOrigin='0 50%'
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
