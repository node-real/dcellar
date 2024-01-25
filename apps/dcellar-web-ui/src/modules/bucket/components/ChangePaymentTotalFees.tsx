import { Box, useDisclosure } from '@totejs/uikit';
import { useAppSelector } from '@/store';
import { selectBnbPrice } from '@/store/slices/global';
import { BN } from '@/utils/math';
import { sumBy } from 'lodash-es';
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';
import { TotalFeeBox } from '@/components/Fee/TotalFeeBox';
import { PrepaidFee } from '@/components/Fee/PrepaidFee';
import { SettlementFee } from '@/components/Fee/SettlementFee';
import { GasFee } from '@/components/Fee/GasFee';
import { FullBalance } from '@/components/Fee/FullBalance';

type ChangePaymentTotalFeeProps = {
  gasFee: string;
  settlementFees: {
    address: string;
    amount: string;
  }[];
  storeFee: string;
};

export const ChangePaymentTotalFee = ({
  gasFee,
  settlementFees,
  storeFee,
}: ChangePaymentTotalFeeProps) => {
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { isOpen, onToggle } = useDisclosure();
  const bnbPrice = useAppSelector(selectBnbPrice);
  // 简化一下CRYPTOCURRENCY_DISPLAY_PRECISION，每次都写好麻烦；
  const amount = BN(gasFee)
    .plus(sumBy(settlementFees, (item) => Number(item.amount)))
    .plus(storeFee)
    .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
    .toString();

  return (
    <TotalFeeBox
      amount={amount}
      onToggle={onToggle}
      expand={isOpen}
      exchangeRate={bnbPrice}
      canExpand={true}
    >
      <PrepaidFee amount={storeFee} />
      {settlementFees &&
        settlementFees.map((item, index) => (
          <Box key={index} w={'100%'}>
            <SettlementFee amount={item.amount} />
            <FullBalance address={item.address} />
          </Box>
        ))}
      <GasFee amount={gasFee} />
      <FullBalance address={loginAccount} />
    </TotalFeeBox>
  );
};
