import { DCButton } from '@/components/common/DCButton';
import { useAppSelector } from '@/store';
import { TAccountInfo } from '@/store/slices/accounts';
import { Flex, QDrawerFooter } from '@totejs/uikit';
import { memo, useState } from 'react';
import { useInterval, useUnmount } from 'ahooks';
import { BasicInfo } from './BasicInfo';
import { useRouter } from 'next/router';
import BigNumber from 'bignumber.js';
import { getTimestampInSeconds } from '@/utils/time';

interface OwnerDetailOperationProps {
  selectAccount: TAccountInfo;
}

export const OwnerDetailOperation = memo<OwnerDetailOperationProps>(function OwnerDetailOperation({
  selectAccount,
}) {
  const [availableBalance, setAvailableBalance] = useState('0');
  const { isLoadingAccountInfo, bankBalance } = useAppSelector((root) => root.accounts);
  const router = useRouter();

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
        loading={!!isLoadingAccountInfo}
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
