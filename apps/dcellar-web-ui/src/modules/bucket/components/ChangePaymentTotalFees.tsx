import { BankBalance } from '@/components/Fee/BankBalance';
import { FullBalance } from '@/components/Fee/FullBalance';
import { GasFee } from '@/components/Fee/GasFee';
import { PrepaidFee } from '@/components/Fee/PrepaidFee';
import { SettlementFee } from '@/components/Fee/SettlementFee';
import { TotalFeeBox } from '@/components/Fee/TotalFeeBox';
import { LearnMoreTips } from '@/components/common/Tips';
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';
import { useAppSelector } from '@/store';
import { selectBnbUsdtExchangeRate } from '@/store/slices/global';
import { BN } from '@/utils/math';
import { useDisclosure } from '@node-real/uikit';

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
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);

  const { isOpen, onToggle } = useDisclosure();
  const exchangeRate = useAppSelector(selectBnbUsdtExchangeRate);

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
      exchangeRate={exchangeRate}
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
