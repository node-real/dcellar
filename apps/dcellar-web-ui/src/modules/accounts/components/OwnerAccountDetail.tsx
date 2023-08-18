import { DCButton } from '@/components/common/DCButton';
import { DCDrawer } from '@/components/common/DCDrawer';
import { useAppDispatch, useAppSelector } from '@/store';
import { setEditOwnerDetail, setupAccountsInfo } from '@/store/slices/accounts';
import {
  Flex,
  QDrawerFooter,
} from '@totejs/uikit';
import React from 'react';
import { useAsyncEffect } from 'ahooks';
import { AccountDetail } from './AccountDetail';
import { useRouter } from 'next/router';

export const OwnerAccountDetail = () => {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((state) => state.persist);
  const { editOwnerDetail, accountsInfo, isLoadingDetail } = useAppSelector((state) => state.accounts);
  const isOpen = !!editOwnerDetail;
  const router = useRouter();
  const onClose = () => {
    dispatch(setEditOwnerDetail(''));
  };
  const onAction = (e: string) => {
    if (['transfer_in', 'transfer_out', 'send'].includes(e)) {
      return router.push(`/wallet?type=${e}`);
    }
  };
  useAsyncEffect(async () => {
    if (!loginAccount) return;
    dispatch(setupAccountsInfo(loginAccount));
  }, [loginAccount]);
  const ownerAccount = accountsInfo[editOwnerDetail]

  return (
    <DCDrawer
      isOpen={isOpen}
      onClose={onClose}
      gaShowName="dc.accounts.detail.show"
      gaClickCloseName="dc.accounts.detail.close.click"
    >
      <AccountDetail loading={isLoadingDetail} title="Owner Account Detail" accountDetail={ownerAccount} />
      <QDrawerFooter>
        <Flex w={'100%'}>
          <DCButton
            variant={'dcGhost'}
            flex={1}
            mr={'16px'}
            borderColor={'readable.normal'}
            gaClickName="dc.file.f_detail_pop.share.click"
            onClick={() => onAction('transfer_in')}
          >
            Transfer In
          </DCButton>
          <DCButton
            variant={'dcPrimary'}
            flex={1}
            gaClickName="dc.file.f_detail_pop.download.click"
            onClick={() => onAction('transfer_out')}
          >
            Transfer Out
          </DCButton>
        </Flex>
      </QDrawerFooter>
    </DCDrawer>
  );
};
