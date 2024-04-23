import { MenuOption } from '@/components/common/DCMenuList';
import { DCSelect } from '@/components/common/DCSelect';
import { useAppDispatch, useAppSelector } from '@/store';
import { SpEntity, setSpLatency, setupSpLatency } from '@/store/slices/sp';
import { trimLongStr } from '@/utils/string';

import { useMount } from 'ahooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { sort } from 'radash';

import { memo } from 'react';
import { TH } from './style';
import { OptionItem } from './OptionItem';

interface SPSelectorProps {
  onChange: (value: SpEntity) => void;
}

export const SPSelector = memo<SPSelectorProps>(function SPSelector({ onChange }) {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const unAvailableSps = useAppSelector((root) => root.persist.unAvailableSps);
  const spRecords = useAppSelector((root) => root.sp.spRecords);
  const specifiedSp = useAppSelector((root) => root.sp.specifiedSp);
  const allSpList = useAppSelector((root) => root.sp.allSpList);
  const spMetaRecords = useAppSelector((root) => root.sp.spMetaRecords);
  const [sp, setSP] = useState({} as SpEntity);
  const [total, setTotal] = useState(0);
  const len = allSpList.length;
  const saveOnChangeRef = useRef(onChange);
  saveOnChangeRef.current = onChange;

  const renderOption = ({ value, disabled }: MenuOption) => {
    const sp = allSpList.find((sp) => sp.operatorAddress === value)!;
    return (
      <OptionItem
        address={sp.operatorAddress}
        name={sp.moniker}
        endpoint={sp.endpoint}
        status={sp.status}
        access={!disabled}
      />
    );
  };

  const onSpChange = (value: string) => {
    setSP(spRecords[value]);
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

  // Sort: Based on the recommended system's sp data, ascending order of latency values for sps -> No sp data from the recommended system -> Unavailable sps
  const options: MenuOption[] = useMemo(
    () =>
      sort(allSpList, (sp) => {
        const meta = spMetaRecords[sp.endpoint];
        if (unAvailableSps.includes(sp.operatorAddress) || sp.status !== 0) {
          return Infinity;
        }
        if (!meta) {
          return Number.MAX_SAFE_INTEGER;
        }

        return meta.Latency;
      }).map((item) => {
        const { operatorAddress, moniker, status } = item;
        const spServiceAvailable = !unAvailableSps.includes(operatorAddress);
        const spStatusAvailable = status === 0;
        const access = spServiceAvailable && spStatusAvailable;

        return {
          label: moniker,
          value: operatorAddress,
          disabled: !access,
        };
      }),
    [allSpList, spMetaRecords, unAvailableSps],
  );

  useMount(() => {
    if (!len) return;
    setTotal(allSpList.length);
    setSP(spRecords[specifiedSp]);
  });

  useEffect(() => {
    if (!sp.operatorAddress) return;
    saveOnChangeRef.current?.(sp);
  }, [sp]);

  useMount(() => {
    dispatch(
      setupSpLatency(
        allSpList
          .filter((sp) => !unAvailableSps.includes(sp.operatorAddress))
          .map((sp) => sp.endpoint),
        loginAccount,
      ),
    );
  });

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const latency: Record<string, number> = {};
      list.getEntries().forEach((entry) => {
        if (entry.name.endsWith('/status')) {
          const { origin, port } = new URL(entry.name);
          latency[origin] = parseInt(String(entry.duration));
          latency[`${origin}:${port || 443}`] = parseInt(String(entry.duration));
        }
      });
      dispatch(setSpLatency(latency));
    });
    // reuse offchain auth request nonce call data
    observer.observe({ type: 'resource', buffered: true });
    return () => {
      observer.disconnect();
    };
  }, [dispatch]);

  return (
    <DCSelect
      value={sp.operatorAddress}
      text={renderItem(sp.moniker, sp.operatorAddress)}
      options={options}
      header={() => (
        <>
          <TH w={216}>SP list ({total})</TH>
          <TH w={80}>Free Quota</TH>
          <TH w={136}>Free Monthly Quota</TH>
          <TH w={80}>Latency</TH>
        </>
      )}
      headerProps={{
        px: 0,
        py: 0,
        display: 'flex',
        alignItems: 'center',
      }}
      renderOption={renderOption}
      onChange={onSpChange}
      onSearchFilter={onSearchFilter}
      onSearch={onSearch}
      itemProps={{
        gaClickName: 'dc.bucket.create_modal.select_sp.click',
        px: 0,
        py: 0,
      }}
    />
  );
});

const renderItem = (moniker: string, address: string) => {
  return [moniker, trimLongStr(address, 10, 6, 4)].filter(Boolean).join(' | ');
};
