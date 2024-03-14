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

interface OwnerDetailOperationProps {
  selectAccount: AccountInfo;
}

export const OwnerDetailOperation = memo<OwnerDetailOperationProps>(function OwnerDetailOperation({
  selectAccount,
}) {
  const accountInfoLoading = useAppSelector((root) => root.accounts.accountInfoLoading);
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);

  const router = useRouter();
  const [availableBalance, setAvailableBalance] = useState('0');

  const onAction = (e: string) => {
    return router.push(`/wallet?type=${e}`);
  };

  const clear = useInterval(() => {
    const { netflowRate, staticBalance, crudTimestamp } = selectAccount;
    const ts = getTimestampInSeconds();
    const needSettleRate = BigNumber(netflowRate || 0).times(BigNumber(ts - crudTimestamp));
    const availableBalance = BigNumber(staticBalance)
      .plus(bankBalance)
      .plus(needSettleRate)
      .toString();
    setAvailableBalance(availableBalance);
  }, 1000);

  useUnmount(clear);

  return (
    <>
      <BasicInfo
        loading={!!accountInfoLoading}
        title="Account Detail"
        accountDetail={selectAccount}
        availableBalance={availableBalance}
      />
      <QDrawerFooter>
        <Flex w={'100%'} gap={16}>
          <DCButton
            size={'lg'}
            flex={1}
            gaClickName="dc.file.f_detail_pop.share.click"
            onClick={() => onAction('transfer_in')}
          >
            Transfer In
          </DCButton>
          <DCButton
            size={'lg'}
            variant="ghost"
            flex={1}
            gaClickName="dc.file.f_detail_pop.download.click"
            onClick={() => onAction('transfer_out')}
          >
            Transfer Out
          </DCButton>
          <DCButton
            size={'lg'}
            variant="ghost"
            flex={1}
            gaClickName="dc.file.f_detail_pop.download.click"
            onClick={() => onAction('send')}
          >
            Send
          </DCButton>
        </Flex>
      </QDrawerFooter>
    </>
  );
});
