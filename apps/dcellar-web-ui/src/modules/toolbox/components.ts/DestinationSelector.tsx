import { MenuOption } from '@/components/common/DCMenuList';
import { DCSelect } from '@/components/common/DCSelect';
import { useAppSelector } from '@/store';
import { Box, Text } from '@totejs/uikit';
import { useMount } from 'ahooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { selectBucketList } from '@/store/slices/bucket';

type DestinationSelectorProps = {
  onChange: (value: any) => void;
};

export const DestinationSelector = ({ onChange }: DestinationSelectorProps) => {
  const { loginAccount } = useAppSelector((root) => root.persist);
  const bucketList = useAppSelector(selectBucketList(loginAccount));
  const [network, setNetwork] = useState({});
  const saveOnChangeRef = useRef(onChange);
  saveOnChangeRef.current = onChange;
  const options: MenuOption[] = useMemo(() => {
    return bucketList
      .filter((item) => item.BucketStatus === 1)
      .map((item) => ({
        label: item.BucketName,
        value: item.BucketName,
      }));
  }, [bucketList]);
  useMount(() => {
    options && setNetwork(options[0]);
  });
  useEffect(() => {
    saveOnChangeRef.current?.(network);
  }, [network]);

  const OptionItem = (props: MenuOption) => {
    const { value, label } = props;
    return (
      <Box key={value} display="flex" flexDir="column" alignItems="flex-start" gap={2}>
        <Text fontSize={14} color="readable.top.secondary" noOfLines={1}>
          {label}
        </Text>
        <Text color={'readable.tertiary'} fontSize={12}>
          {value}
        </Text>
      </Box>
    );
  };
  const renderOption = ({ label, value }: MenuOption) => {
    return <OptionItem label={label} value={value} />;
  };

  return (
    <DCSelect
      value="bnb-chain"
      text={options[0].label as string}
      options={options}
      renderOption={renderOption}
      onChange={onChange}
    />
  );
};
