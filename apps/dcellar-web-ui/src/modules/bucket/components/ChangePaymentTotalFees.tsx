import { useDisclosure } from '@node-real/uikit';
import { useAppSelector } from '@/store';
import { selectBnbPrice } from '@/store/slices/global';
import { BN } from '@/utils/math';
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';
import { TotalFeeBox } from '@/components/Fee/TotalFeeBox';
import { PrepaidFee } from '@/components/Fee/PrepaidFee';
import { SettlementFee } from '@/components/Fee/SettlementFee';
import { GasFee } from '@/components/Fee/GasFee';
import { FullBalance } from '@/components/Fee/FullBalance';
import { BankBalance } from '@/components/Fee/BankBalance';
import { LearnMoreTips } from '@/components/common/Tips';

export type TSettlementFee = {
  address: string;
  amount: string;
};
export type ChangePaymentTotalFeeProps = {
  gasFee: string;
  from: TSettlementFee;
  to: TSettlementFee;
  storeFee: string;
};

const TipsLink =
  'https://docs.nodereal.io/docs/dcellar-faq#question-how-much-to-pay-for-changing-payment-account';
const Tips = <LearnMoreTips href={TipsLink} text="Total Fees" />;

export const ChangePaymentTotalFee = ({
  gasFee,
  from,
  to,
  storeFee,
}: ChangePaymentTotalFeeProps) => {
  const { isOpen, onToggle } = useDisclosure();
  const bnbPrice = useAppSelector(selectBnbPrice);
  const { bankBalance } = useAppSelector((root) => root.accounts);
  const amount = BN(gasFee)
    .plus(from.amount)
    .plus(to.amount)
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
      Tips={Tips}
    >
      <SettlementFee amount={from.amount} />
      <FullBalance address={from.address} />
      <PrepaidFee amount={storeFee} />
      <SettlementFee amount={to.amount} />
      <FullBalance address={to.address} />
      <GasFee amount={gasFee} />
      <BankBalance amount={bankBalance} />
    </TotalFeeBox>
  );
};
