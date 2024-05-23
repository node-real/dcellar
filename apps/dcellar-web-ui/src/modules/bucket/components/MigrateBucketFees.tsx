import { BankBalance } from '@/components/Fee/BankBalance';
import { FullBalance } from '@/components/Fee/FullBalance';
import { GasFee } from '@/components/Fee/GasFee';
import { SettlementFee } from '@/components/Fee/SettlementFee';
import { TotalFeeBox } from '@/components/Fee/TotalFeeBox';
import { LearnMoreTips } from '@/components/common/Tips';
import { CRYPTOCURRENCY_DISPLAY_PRECISION } from '@/modules/wallet/constants';
import { useAppSelector } from '@/store';
import { selectBnbUsdtExchangeRate } from '@/store/slices/global';
import { BN } from '@/utils/math';
import { useDisclosure } from '@node-real/uikit';

export type MigrateBucketFeesProps = {
  gasFee: number;
  settlementFee: string;
  paymentAddress: string;
};

const TipsLink =
  'https://docs.nodereal.io/docs/dcellar-faq#question-how-much-to-pay-for-changing-payment-account';
const Tips = <LearnMoreTips href={TipsLink} text="Total Fees" />;

export const MigrateBucketFees = ({
  gasFee,
  settlementFee,
  paymentAddress,
}: MigrateBucketFeesProps) => {
  const { isOpen, onToggle } = useDisclosure();
  const ownerAccount = useAppSelector((root) => root.persist.loginAccount);
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);
  const exchangeRate = useAppSelector(selectBnbUsdtExchangeRate);

  const amount = BN(gasFee).plus(settlementFee).dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString();

  return (
    <TotalFeeBox
      amount={amount}
      onToggle={onToggle}
      expand={isOpen}
      exchangeRate={exchangeRate}
      canExpand={true}
      Tips={Tips}
    >
      <SettlementFee amount={settlementFee} />
      <FullBalance address={paymentAddress} />
      <GasFee amount={String(gasFee)} />
      <BankBalance amount={bankBalance} />
    </TotalFeeBox>
  );
};
