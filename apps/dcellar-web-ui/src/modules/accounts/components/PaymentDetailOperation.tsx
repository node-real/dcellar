import { DCButton } from '@/components/common/DCButton';
import { useAppSelector } from '@/store';
import { AccountInfo } from '@/store/slices/accounts';
import { getTimestampInSeconds } from '@/utils/time';
import { Flex, QDrawerFooter } from '@node-real/uikit';
import { useInterval, useUnmount } from 'ahooks';
import BigNumber from 'bignumber.js';
import { useRouter } from 'next/router';
import { memo, useState } from 'react';
import { BasicInfo } from './BasicInfo';

interface PaymentDetailOperationProps {
  selectAccount: AccountInfo;
  selectAccountId: string;
}

export const PaymentDetailOperation = memo<PaymentDetailOperationProps>(
  function PaymentDetailOperation({ selectAccount: paymentAccount, selectAccountId }) {
    const loginAccount = useAppSelector((root) => root.persist.loginAccount);
    const accountInfoLoading = useAppSelector((root) => root.accounts.accountInfoLoading);

    const [availableBalance, setAvailableBalance] = useState('0');
    const router = useRouter();

    const isNonRefundable = paymentAccount.refundable;
    const isFrozen = paymentAccount.status === 1;

    const onAction = (e: string) => {
      if (e === 'withdraw') {
        return router.push(`/wallet?type=send&from=${selectAccountId}`);
      }
      if (e === 'deposit') {
        return router.push(`/wallet?type=send&from=${loginAccount}&to=${selectAccountId}`);
      }
    };

    const clear = useInterval(() => {
      if (!paymentAccount) return;
      const { netflowRate, staticBalance, crudTimestamp } = paymentAccount;
      const ts = getTimestampInSeconds();
      const needSettleRate = BigNumber(netflowRate || 0).times(BigNumber(ts - crudTimestamp));
      const availableBalance = BigNumber(staticBalance).plus(needSettleRate).toString();
      setAvailableBalance(availableBalance);
    }, 1000);

    useUnmount(clear);

    return (
      <>
        <BasicInfo
          loading={!!accountInfoLoading}
          title="Account Detail"
          accountDetail={paymentAccount}
          availableBalance={availableBalance}
        />
        {!accountInfoLoading && (
          <QDrawerFooter>
            <Flex w={'100%'} gap={16}>
              <DCButton
                size={'lg'}
                variant={'brand'}
                flex={1}
                gaClickName="dc.file.f_detail_pop.download.click"
                onClick={() => onAction('deposit')}
              >
                Deposit
              </DCButton>
              {isNonRefundable && !isFrozen && (
                <DCButton
                  size={'lg'}
                  flex={1}
                  variant="ghost"
                  gaClickName="dc.file.f_detail_pop.share.click"
                  onClick={() => onAction('withdraw')}
                >
                  Withdraw
                </DCButton>
              )}
            </Flex>
          </QDrawerFooter>
        )}
      </>
    );
  },
);
