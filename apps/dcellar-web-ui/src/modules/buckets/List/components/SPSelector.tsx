import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, Text, Tooltip } from '@totejs/uikit';
import { IDCSelectOption, Select } from '@/components/common/DCSelect';
import { trimLongStr } from '@/utils/string';
import { useAppSelector } from '@/store';
import { useMount } from 'ahooks';
import { SpItem } from '@/store/slices/sp';
import { ExternalLinkIcon } from '@totejs/icons';
import styled from '@emotion/styled';
import { ColoredInfoIcon } from '@totejs/icons';
import RefLink from '@/components/common/SvgIcon/RefLink.svg';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { formatBytes } from '@/modules/file/utils';
import BigNumber from 'bignumber.js';
import { transientOptions } from '@/utils/transientOptions';
import { css } from '@emotion/react';
import { sortBy } from 'lodash-es';

interface SPSelector {
  onChange: (value: SpItem) => void;
}

export function SPSelector(props: SPSelector) {
  const { spInfo, oneSp, allSps, spMeta } = useAppSelector((root) => root.sp);
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
      sortBy(allSps, [(i) => (faultySps.includes(i.operatorAddress) ? 1 : 0), (sp) => {
        const meta = spMeta[sp.operatorAddress];
        return meta ? meta.Latency : Infinity;
      },]).map((item) => {
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
    [allSps, spMeta],
  );

  return (
    <Select
      value={sp.operatorAddress}
      text={renderItem(sp.moniker, sp.operatorAddress)}
      options={options}
      header={
        <Row>
          <TH w={200}>SP list</TH>
          <TH w={100}>Free Quota</TH>
          <TH w={120}>
            Storage Fee{' '}
            <Tooltip content="BNB/GB/Month" placement="bottom-start">
              <ColoredInfoIcon boxSize={16} />
            </Tooltip>
          </TH>
          <TH w={100}>Latency</TH>
        </Row>
      }
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
  const { spMeta } = useAppSelector((root) => root.sp);
  const { address, name, endpoint, access } = props;
  const meta = spMeta[address];

  return (
    <Flex key={address} alignItems="center">
      <TD
        w={200}
        key={address}
        display="flex"
        flexDir="column"
        alignItems="flex-start"
        whiteSpace="normal"
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
            color="readable.top.secondary"
            noOfLines={1}
          >
            {name}
          </Text>
          <A
            href={`${GREENFIELD_CHAIN_EXPLORER_URL}/account/${address}`}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
          >
            <RefLink />
          </A>
        </Flex>

        <Tooltip content={endpoint} placement="bottom-start">
          <Text
            lineHeight="14px"
            wordBreak="break-all"
            fontSize={12}
            transformOrigin="0 50%"
            transform={'scale(0.85)'}
            fontWeight={400}
            color="#76808F"
            noOfLines={1}
          >
            {endpoint}
          </Text>
        </Tooltip>
      </TD>
      <TD w={100}>{meta ? formatBytes(meta.FreeReadQuota) : '--'}</TD>
      <TD w={120}>{meta ? Number(BigNumber(meta.StorePrice).toFixed(5)) : '--'}</TD>
      <TD $dot={meta?.Latency}>{meta ? meta.Latency + 'ms' : '--'}</TD>
    </Flex>
  );
}

const A = styled.a`
  :hover {
    color: #00ba34;
  }
  margin-left: 4px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e6e8ea;
  background: #f5f5f5;
`;

const TH = styled(Box)`
  padding: 8px;
  font-size: 12px;
  font-weight: 500;
  height: 32px;
  &:first-of-type {
    padding-left: 12px;
    padding-right: 12px;
  }
`;

const TD = styled(Box, transientOptions)<{ $dot?: number }>`
  position: relative;
  padding: 8px;
  font-size: 14px;
  color: #474d57;
  font-weight: 400;
  &:first-of-type {
    padding-left: 32px;
  }

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
