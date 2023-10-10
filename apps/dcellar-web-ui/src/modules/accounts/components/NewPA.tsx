import { DCButton } from '@/components/common/DCButton';
import { createPaymentAccount } from '@/facade/account';
import { BUTTON_GOT_IT, WALLET_CONFIRM } from '@/modules/object/constant';
import { MIN_AMOUNT } from '@/modules/wallet/constants';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupPaymentAccounts } from '@/store/slices/accounts';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import { Box, Link, Popover, PopoverBody, PopoverContent, PopoverTrigger } from '@totejs/uikit';
import BigNumber from 'bignumber.js';
import { useRouter } from 'next/router';
import React, { memo, useState } from 'react';
import { useAccount } from 'wagmi';
import { InternalRoutePaths } from '@/utils/constant';
import { Animates } from '@/components/AnimatePng';
import { ConfirmModal } from '@/components/common/DCModal/ConfirmModal';
import { MsgCreatePaymentAccountTypeUrl } from '@bnb-chain/greenfield-js-sdk';

interface NewPAProps {}

export const NewPA = memo<NewPAProps>(function NewPA() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { connector } = useAccount();
  const { loginAccount } = useAppSelector((state) => state.persist);
  const { bankBalance } = useAppSelector((state) => state.accounts);
  const { gasObjects = {} } = useAppSelector((root) => root.global.gasHub);
  const [confirmModal, setConfirmModal] = useState(false);
  const hasBankBalance = BigNumber(bankBalance).gt(BigNumber(MIN_AMOUNT));
  const refreshPAList = () => {
    dispatch(setupPaymentAccounts());
  };
  const onCreatePaymentClick = async () => {
    dispatch(
      setStatusDetail({
        title: 'Creating Payment Account',
        icon: Animates.object,
        desc: WALLET_CONFIRM,
      }),
    );
    if (!connector) return;

    const [res, error] = await createPaymentAccount(loginAccount, connector);
    if (error && typeof error === 'string') {
      return dispatch(
        setStatusDetail({
          title: 'Create Failed',
          icon: 'status-failed',
          desc: error || '',
          buttonText: BUTTON_GOT_IT,
        }),
      );
    }
    refreshPAList();
    dispatch(setStatusDetail({} as TStatusDetail));
  };

  const fee = gasObjects?.[MsgCreatePaymentAccountTypeUrl]?.gasFee || 0;

  return (
    <>
      <ConfirmModal
        confirmText="Confirm"
        isOpen={confirmModal}
        ga={{
          gaClickCloseName: 'dc.account.create_payment_account.modal.show',
          gaShowName: 'dc.account.create_payment_account.close.click',
          balanceClickName: 'dc.account.create_payment_account.depost.show',
          balanceShowName: 'dc.account.create_payment_account.transferin.click',
          cancelButton: 'dc.account.create_payment_account.cancel.click',
          confirmButton: 'dc.account.create_payment_account.delete.click',
        }}
        title="Create Payment Account"
        fee={fee}
        onConfirm={onCreatePaymentClick}
        onClose={() => {
          setConfirmModal(false);
        }}
        description="Are you sure you want to create a new payment account?"
      />
      <Popover trigger={'hover'}>
        <PopoverTrigger>
          <Box>
            <DCButton
              h={40}
              gaClickName="dc.file.f_detail_pop.download.click"
              onClick={() => setConfirmModal(true)}
              disabled={!hasBankBalance}
            >
              Create Payment Account
            </DCButton>
          </Box>
        </PopoverTrigger>
        <PopoverContent
          bg="#fff"
          padding="8px"
          color={'readable.normal'}
          border={'1px solid readable.border'}
          borderRadius={4}
          visibility={hasBankBalance ? 'hidden' : 'visible'}
        >
          <PopoverBody>
            <Box w={232} textAlign={'left'}>
              Insufficient balance in Owner Account.{' '}
              <Link
                textDecoration={'underline'}
                onClick={() => router.push(InternalRoutePaths.transfer_in)}
                _hover={{
                  textDecoration: 'underline',
                }}
              >
                Transfer In
              </Link>
            </Box>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </>
  );
});
