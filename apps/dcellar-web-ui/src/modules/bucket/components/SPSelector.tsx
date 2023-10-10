import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, Text } from '@totejs/uikit';
import { DCSelect } from '@/components/common/DCSelect';
import { trimLongStr } from '@/utils/string';
import { useAppSelector } from '@/store';
import { useMount } from 'ahooks';
import { SpItem } from '@/store/slices/sp';
import { ExternalLinkIcon } from '@totejs/icons';
import styled from '@emotion/styled';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { transientOptions } from '@/utils/css';
import { css } from '@emotion/react';
import { find, sortBy } from 'lodash-es';
import { DCTooltip } from '@/components/common/DCTooltip';
import { IconFont } from '@/components/IconFont';
import { MenuOption } from '@/components/common/DCMenuList';
import { formatBytes } from '@/utils/formatter';

interface SPSelector {
  onChange: (value: SpItem) => void;
}

export function SPSelector(props: SPSelector) {
  const { spInfo, oneSp, allSps, spMeta } = useAppSelector((root) => root.sp);
  const { faultySps } = useAppSelector((root) => root.persist);
  const len = allSps.length;
  const [sp, setSP] = useState({} as SpItem);
  const { onChange } = props;
  const [total, setTotal] = useState(0);
  const saveOnChangeRef = useRef(onChange);
  saveOnChangeRef.current = onChange;

  useMount(() => {
    if (!len) return;
    setTotal(allSps.length);
    setSP(spInfo[oneSp]);
  });

  useEffect(() => {
    if (!sp.operatorAddress) return;
    saveOnChangeRef.current?.(sp);
  }, [sp]);

  const onChangeSP = (value: string) => {
    setSP(spInfo[value]);
  };

  const onSearch = (result: MenuOption[]) => {
    setTotal(result.length);
  };

  const onSearchFilter = (keyword: string, item: MenuOption) => {
    const tmpKeyword = keyword.toLowerCase();
    const tmpValue = item.value.toLowerCase();
    const tmpName = item.label.toLowerCase();
    return tmpValue.includes(tmpKeyword) || tmpName.includes(tmpKeyword);
  };

  const options: MenuOption[] = useMemo(
    () =>
      sortBy(allSps, [
        (i) => (faultySps.includes(i.operatorAddress) ? 1 : 0),
        (sp) => {
          const meta = spMeta[sp.endpoint];
          return meta ? meta.Latency : Infinity;
        },
      ]).map((item) => {
        const { operatorAddress, moniker } = item;
        const access = !faultySps.includes(operatorAddress);
        return {
          label: moniker,
          value: operatorAddress,
          disabled: !access,
        };
      }),
    [allSps, spMeta],
  );

  const renderOption = ({ value, disabled }: MenuOption) => {
    const sp = find<SpItem>(allSps, (sp) => sp.operatorAddress === value)!;
    return (
      <OptionItem
        address={sp.operatorAddress}
        name={sp.moniker}
        endpoint={sp.endpoint}
        access={!disabled}
      />
    );
  };

  return (
    <DCSelect
      value={sp.operatorAddress}
      text={renderItem(sp.moniker, sp.operatorAddress)}
      options={options}
      header={() => (
        <>
          <TH w={280}>SP list ({total})</TH>
          <TH w={120}>Free Quota</TH>
          <TH w={120}>Latency</TH>
        </>
      )}
      headerProps={{
        px: 0,
        py: 0,
        display: 'flex',
        alignItems: 'center',
      }}
      renderOption={renderOption}
      onChange={onChangeSP}
      onSearchFilter={onSearchFilter}
      onSearch={onSearch}
      itemProps={{
        gaClickName: 'dc.bucket.create_modal.select_sp.click',
        px: 0,
        py: 0,
      }}
    />
  );
}

const renderItem = (moniker: string, address: string) => {
  return [moniker, trimLongStr(address, 10, 6, 4)].filter(Boolean).join(' | ');
};

function OptionItem(props: any) {
  const { spMeta } = useAppSelector((root) => root.sp);
  const { address, name, endpoint, access } = props;
  const meta = spMeta[endpoint];

  const link = !access ? (
    <DCTooltip title="Check reasons in documentations" placement="bottomLeft">
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
    </DCTooltip>
  ) : (
    <A
      href={`${GREENFIELD_CHAIN_EXPLORER_URL}/account/${address}`}
      target="_blank"
      onClick={(e) => e.stopPropagation()}
    >
      <IconFont type="external" w={12} />
    </A>
  );

  return (
    <Flex key={address} alignItems="center" cursor={access ? 'pointer' : 'not-allowed'}>
      <TD
        w={251}
        key={address}
        display="flex"
        flexDir="column"
        alignItems="flex-start"
        whiteSpace="normal"
        color={access ? '#474D57' : '#AEB4BC'}
      >
        <Flex alignItems="center" w="100%">
          <Text
            maxW="max-content"
            minW={0}
            flex={1}
            lineHeight="17px"
            fontSize={14}
            fontWeight={400}
            w="100%"
            color={access ? '#474D57' : '#AEB4BC'}
            noOfLines={1}
          >
            {name}
          </Text>
          {link}
        </Flex>

        <DCTooltip title={endpoint} placement="bottomLeft">
          <Text
            lineHeight="14px"
            wordBreak="break-all"
            fontSize={12}
            transformOrigin="0 50%"
            transform={'scale(0.85)'}
            fontWeight={400}
            color={access ? '#76808F' : '#AEB4BC'}
            noOfLines={1}
          >
            {endpoint}
          </Text>
        </DCTooltip>
      </TD>
      <TD w={120} color={access ? '#474D57' : '#AEB4BC'}>
        {meta ? formatBytes(meta.FreeReadQuota) : '--'}
      </TD>
      <TD $dot={meta?.Latency} color={access ? '#474D57' : '#AEB4BC'}>
        {meta ? meta.Latency + 'ms' : '--'}
      </TD>
    </Flex>
  );
}

const A = styled.a`
  :hover {
    color: #00ba34;
  }
  margin-left: 4px;
`;

const TH = styled(Box)`
  padding: 8px;
  &:first-of-type {
    padding-left: 12px;
    padding-right: 12px;
  }
  svg {
    color: #aeb4bc;
    :hover {
      color: #76808f;
    }
  }
`;

const TD = styled(Box, transientOptions)<{ $dot?: number }>`
  height: 31px;
  position: relative;
  font-size: 14px;
  font-weight: 400;

  ${(props) =>
    props.$dot &&
    css`
      :before {
        position: relative;
        top: -1px;
        margin-right: 4px;
        display: inline-flex;
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 100%;

        background-color: ${props.$dot < 100
          ? '#00BA34'
          : props.$dot < 200
          ? '#EEBE11'
          : '#EE3911'};
      }
    `}
`;
