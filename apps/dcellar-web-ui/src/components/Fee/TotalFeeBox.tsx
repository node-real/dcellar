import { renderFeeValue } from '@/modules/object/utils';
import { Divider, Flex, FlexProps, Text } from '@node-real/uikit';
import { IconFont } from '../IconFont';
import React from 'react';

export type TotalFeeBoxProps = FlexProps & {
  expand: boolean;
  amount: string;
  canExpand: boolean;
  exchangeRate: string;
  onToggle: () => void;
  Tips?: React.ReactNode;
};
export const TotalFeeBox = ({
  expand,
  canExpand,
  amount,
  exchangeRate,
  onToggle,
  Tips,
  children,
}: TotalFeeBoxProps) => {
  return (
    <Flex
      gap={8}
      padding={'8px 12px'}
      borderRadius={4}
      w="100%"
      bg="bg.bottom"
      flexDirection="column"
    >
      <Flex
        fontSize={'14px'}
        fontWeight={600}
        onClick={() => canExpand && onToggle()}
        justifyContent={'space-between'}
        alignItems={'center'}
        cursor={expand ? 'pointer' : 'default'}
      >
        <Flex alignItems="center">
          <Text>Total Fees</Text>
          {Tips}
        </Flex>
        <Flex
          color={'readable.secondary'}
          alignItems="center"
          gap={4}
          justifySelf={'flex-end'}
          fontWeight={'400'}
        >
          {renderFeeValue(amount, exchangeRate)}
          {canExpand && (
            <IconFont color={'readable.normal'} type={expand ? 'menu-open' : 'menu-close'} w={20} />
          )}
        </Flex>
      </Flex>
      {canExpand && expand && <Divider borderColor={'readable.disable'} />}
      {expand && children}
    </Flex>
  );
};
