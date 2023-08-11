import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, Text } from '@totejs/uikit';
import { IDCSelectOption, Select } from '@/components/common/DCSelect';
import { trimLongStr } from '@/utils/string';
import { useAppSelector } from '@/store';
import { useMount } from 'ahooks';
import { SpItem } from '@/store/slices/sp';
import { sortBy } from 'lodash-es';
import { ExternalLinkIcon } from '@totejs/icons';

interface SPSelector {
  onChange: (value: SpItem) => void;
}

export function SPSelector(props: SPSelector) {
  const { spInfo, oneSp, allSps } = useAppSelector((root) => root.sp);
  const { faultySps } = useAppSelector((root) => root.persist);
  const len = allSps.length;
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
      sortBy(allSps, [(i) => (faultySps.includes(i.operatorAddress) ? 1 : 0)]).map((item) => {
        const { operatorAddress, moniker: name, endpoint } = item;
        const access = !faultySps.includes(operatorAddress);
        return {
          label: (
            <OptionItem address={operatorAddress} name={name} endpoint={endpoint} access={access} />
          ),
          value: operatorAddress,
          name,
          endpoint: item.endpoint,
          access,
        };
      }),
    [allSps],
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
  const { address, name, endpoint, access } = props;

  return (
    <Box
      cursor={access ? 'pointer' : 'not-allowed'}
      key={address}
      display="flex"
      flexDir="column"
      alignItems="flex-start"
      whiteSpace="normal"
    >
      <Flex>
        <Text
          fontSize={16}
          lineHeight="19px"
          fontWeight={400}
          w="100%"
          color={access ? 'readable.top.secondary' : '#aeb4bc'}
          noOfLines={1}
        >
          {renderItem(name, address)}{' '}
        </Text>
        {!access && (
          <Text
            as="a"
            target="_blank"
            href="https://docs.nodereal.io/docs/dcellar-faq#storage-provider-related"
            w={64}
            h={18}
            whiteSpace="nowrap"
            ml={4}
            bgColor="#FDEBE7"
            borderRadius={'360px'}
            color="#F15D3C"
            fontWeight={400}
            lineHeight="18px"
            cursor="pointer"
            _hover={{
              color: '#EE3911',
            }}
          >
            <Box as="span" transform="scale(.8)" display="inline-flex" alignItems="center">
              SP Error <ExternalLinkIcon boxSize={12} ml={2} />
            </Box>
          </Text>
        )}
      </Flex>
      {name && (
        <Text
          mt={2}
          fontSize={12}
          transformOrigin="0 50%"
          transform={'scale(0.85)'}
          lineHeight="18px"
          fontWeight={400}
          color={access ? 'readable.secondary' : '#AEB4BC'}
          noOfLines={1}
        >
          {endpoint}
        </Text>
      )}
    </Box>
  );
}
