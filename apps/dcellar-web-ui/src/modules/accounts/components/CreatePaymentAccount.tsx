import { Animates } from '@/components/AnimatePng';
import { DCButton } from '@/components/common/DCButton';
import { TxConfirmModal } from '@/components/common/DCModal/TxConfirmModal';
import { InternalRoutePaths } from '@/constants/paths';
import { createPaymentAccount } from '@/facade/account';
import { BUTTON_GOT_IT, WALLET_CONFIRM } from '@/modules/object/constant';
import { MIN_AMOUNT } from '@/modules/wallet/constants';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupPaymentAccounts } from '@/store/slices/accounts';
import { MsgCreatePaymentAccountTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { Box, Link, Popover, PopoverBody, PopoverContent, PopoverTrigger } from '@node-real/uikit';
import BigNumber from 'bignumber.js';
import { useRouter } from 'next/router';
import { memo, useState } from 'react';
import { useAccount } from 'wagmi';
import { GAContextProvider } from '@/context/GAContext';
import { selectGnfdGasFeesConfig, setSignatureAction } from '@/store/slices/global';

interface CreatePaymentAccountProps {}

export const CreatePaymentAccount = memo<CreatePaymentAccountProps>(
  function CreatePaymentAccount() {
    const dispatch = useAppDispatch();
    const loginAccount = useAppSelector((root) => root.persist.loginAccount);
    const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);
    const gnfdGasFeesConfig = useAppSelector(selectGnfdGasFeesConfig);

    const router = useRouter();
    const { connector } = useAccount();
    const [confirmModal, setConfirmModal] = useState(false);

    const hasBankBalance = BigNumber(bankBalance).gt(BigNumber(MIN_AMOUNT));
    const fee = gnfdGasFeesConfig?.[MsgCreatePaymentAccountTypeUrl]?.gasFee || 0;

    const refreshPaymentAccountList = () => {
      dispatch(setupPaymentAccounts());
    };

    const onCreatePayment = async () => {
      dispatch(
        setSignatureAction({
          title: 'Creating Payment Account',
          icon: Animates.object,
          desc: WALLET_CONFIRM,
        }),
      );
      if (!connector) return;

      const [res, error] = await createPaymentAccount(loginAccount, connector);
      if (error && typeof error === 'string') {
        dispatch(
          setSignatureAction({
            title: 'Create Failed',
            icon: 'status-failed',
            desc: error || '',
            buttonText: BUTTON_GOT_IT,
          }),
        );
        return;
      }
      refreshPaymentAccountList();
      dispatch(setSignatureAction({}));
    };

    return (
      <>
        <GAContextProvider prefix={'create_payment_account'}>
          <TxConfirmModal
            confirmText="Confirm"
            isOpen={confirmModal}
            title="Create Payment Account"
            fee={fee}
            onConfirm={onCreatePayment}
            onClose={() => {
              setConfirmModal(false);
            }}
            description="Are you sure you want to create a new payment account?"
          />
        </GAContextProvider>
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
  },
);
