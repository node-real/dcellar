import { Flex, Text } from '@node-real/uikit';
import { useMemo } from 'react';
import { useNetwork } from 'wagmi';

import { WalletOperationInfos } from '../constants';
import { isRightChain } from '../utils/isRightChain';

import { IconFont } from '@/components/IconFont';
import { useAppSelector } from '@/store';

type Props = {
  amount: string;
  formError: boolean;
};
const LARGE_TRANSFER_AMOUNT = 1000;
const LARGE_TRANSFER_WAIT_TIME = 12;

export const LargeAmountTip = ({ amount, formError }: Props) => {
  const transferType = useAppSelector((root) => root.wallet.transferType);

  const { chain } = useNetwork();

  const curInfo = WalletOperationInfos[transferType];

  const isRight = useMemo(() => {
    return isRightChain(chain?.id, curInfo?.chainId);
  }, [chain?.id, curInfo?.chainId]);

  if (
    formError ||
    !['transfer_in', 'transfer_out'].includes(transferType) ||
    Number(amount) < LARGE_TRANSFER_AMOUNT ||
    !isRight
  ) {
    return null;
  }

  return (
    <Flex gap={4} marginTop={8}>
      <IconFont type="warning" w={16} color={'scene.danger.normal'} />
      <Text fontSize={14} color={'readable.tertiary'}>
        {LARGE_TRANSFER_WAIT_TIME}-hour wait for cross chain transfer of {LARGE_TRANSFER_AMOUNT}+
        BNB.
      </Text>
    </Flex>
  );
};
