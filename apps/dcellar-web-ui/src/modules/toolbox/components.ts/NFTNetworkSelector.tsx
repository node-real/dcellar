import { MenuOption } from '@/components/common/DCMenuList';
import { DCSelect } from '@/components/common/DCSelect';
import { Box, Text } from '@totejs/uikit';
import { useMount } from 'ahooks';
import { useEffect, useRef, useState } from 'react';

type NFTNetworkSelectorProps = {
  onChange: (value: any) => void;
};

const networks = [{
  enum: 'bnb-chain',
  name: 'BNB Smart Chain',
}]
export const NFTNetworkSelector = ({ onChange }: NFTNetworkSelectorProps) => {
  const [network, setNetwork] = useState({});
  const saveOnChangeRef = useRef(onChange);
  saveOnChangeRef.current = onChange;
  const options: MenuOption[] = [
    {
      label: 'BNB Smart Chain',
      value: 'bnb-chain',
      disabled: false,
    },
  ];
  useMount(() => {
    setNetwork(options[0]);
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
