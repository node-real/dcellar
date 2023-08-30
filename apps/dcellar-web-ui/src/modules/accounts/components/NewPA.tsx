import { DCButton } from '@/components/common/DCButton';
import { createPaymentAccount } from '@/facade/account';
import { FILE_FAILED_URL, PENDING_ICON_URL } from '@/modules/file/constant';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupPaymentAccounts } from '@/store/slices/accounts';
import { TStatusDetail, setStatusDetail } from '@/store/slices/object';
import React from 'react';
import { useAccount } from 'wagmi';

export const NewPA = () => {
  const dispatch = useAppDispatch();
  const { connector } = useAccount();
  const { loginAccount } = useAppSelector((state) => state.persist);
  const refreshPAList = () => {
    dispatch(setupPaymentAccounts());
  }
  const onCreatePaymentClick = async () => {
    dispatch(
      setStatusDetail({
        title: 'Creating Payment Account',
        icon: PENDING_ICON_URL,
        desc: 'Confirm this transaction in your wallet.',
      }),
    );
    if (!connector) return;

    const [res, error] = await createPaymentAccount(loginAccount, connector);
    if (error && typeof error === 'string') {
      return dispatch(
        setStatusDetail({
          title: 'Create Payment Account Failed',
          icon: FILE_FAILED_URL,
          desc: error || '',
        }),
      );
    }
    refreshPAList();
    dispatch(setStatusDetail({} as TStatusDetail));
  };

  return (
    <DCButton
      h={40}
      width={'fit-content'}
      variant={'dcPrimary'}
      gaClickName="dc.file.f_detail_pop.download.click"
      onClick={() => onCreatePaymentClick()}
    >
      Create Payment Account
    </DCButton>
  );
};
