import { DCButton } from '@/components/common/DCButton';
import { DCDrawer } from '@/components/common/DCDrawer';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectAccount, setEditOwnerDetail, setupAccountsInfo } from '@/store/slices/accounts';
import {
  Flex,
  QDrawerFooter,
} from '@totejs/uikit';
import React, { use, useEffect } from 'react';
import { useAsyncEffect, useInterval } from 'ahooks';
import { AccountDetail } from './AccountDetail';
import { useRouter } from 'next/router';
import { getUtcZeroTimestamp } from '@bnb-chain/greenfield-js-sdk';
import BigNumber from 'bignumber.js';

export const OwnerAccountDetail = () => {
  const dispatch = useAppDispatch();
  const [lockFee, setLockFee] = React.useState('0');
  const { loginAccount } = useAppSelector((state) => state.persist);
  const { editOwnerDetail, isLoadingDetail } = useAppSelector((state) => state.accounts);
  const isOpen = !!editOwnerDetail;
  const router = useRouter();
  const onClose = () => {
    dispatch(setEditOwnerDetail(''));
  };
  const ownerAccount = useAppSelector(selectAccount(editOwnerDetail));
  const onAction = (e: string) => {
    if (['transfer_in', 'transfer_out', 'send'].includes(e)) {
      return router.push(`/wallet?type=${e}`);
    }
  };
  useAsyncEffect(async () => {
    if (!loginAccount) return;
    dispatch(setupAccountsInfo(loginAccount));
  }, [loginAccount]);

  const clear = useInterval(() => {
    if (!ownerAccount) return;
    const { netflowRate, bufferBalance, crudTimestamp } = ownerAccount;
    const ts = Math.floor(getUtcZeroTimestamp() / 1000);
    const costLockFee = BigNumber(netflowRate || 0).times(BigNumber(ts - crudTimestamp));
    const lockFee = BigNumber(bufferBalance).plus(costLockFee).toString();
    setLockFee(lockFee);
  }, 1000);

  useEffect(() => {
    return () => clear();
  }, [clear]);

  return (
    <DCDrawer
      isOpen={isOpen}
      onClose={onClose}
      gaShowName="dc.accounts.detail.show"
      gaClickCloseName="dc.accounts.detail.close.click"
    >
      <AccountDetail loading={isLoadingDetail} title="Owner Account Detail" accountDetail={ownerAccount} />
      <QDrawerFooter>
        <Flex w={'100%'} gap={16}>
          <DCButton
            variant={'dcPrimary'}
            flex={1}
            borderColor={'readable.normal'}
            gaClickName="dc.file.f_detail_pop.share.click"
            onClick={() => onAction('transfer_in')}
          >
            Transfer In
          </DCButton>
          <DCButton
            variant={'dcGhost'}
            flex={1}
            borderColor='#e6e8ea'
            gaClickName="dc.file.f_detail_pop.download.click"
            onClick={() => onAction('transfer_out')}
          >
            Transfer Out
          </DCButton>
          <DCButton
            variant={'dcGhost'}
            flex={1}
            borderColor='#e6e8ea'
            gaClickName="dc.file.f_detail_pop.download.click"
            onClick={() => onAction('send')}
          >
            Send
          </DCButton>
        </Flex>
      </QDrawerFooter>
    </DCDrawer>
  );
};
