import { DCButton } from '@/components/common/DCButton';
import { InternalRoutePaths } from '@/constants/paths';
import { createPaymentAccount } from '@/facade/account';
import { FILE_FAILED_URL, PENDING_ICON_URL } from '@/modules/file/constant';
import { MIN_AMOUNT } from '@/modules/wallet/constants';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupPaymentAccounts } from '@/store/slices/accounts';
import { TStatusDetail, setStatusDetail } from '@/store/slices/object';
import { Box, Link, Popover, PopoverBody, PopoverContent, PopoverTrigger } from '@totejs/uikit';
import BigNumber from 'bignumber.js';
import { useRouter } from 'next/router';
import React from 'react';
import { useAccount } from 'wagmi';

export const NewPA = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { connector } = useAccount();
  const { loginAccount } = useAppSelector((state) => state.persist);
  const { bankBalance } = useAppSelector((state) => state.accounts);
  const hasBankBalance = BigNumber(bankBalance).gt(BigNumber(MIN_AMOUNT));
  const refreshPAList = () => {
    dispatch(setupPaymentAccounts());
  };
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
          title: 'Create Failed',
          icon: FILE_FAILED_URL,
          desc: error || '',
        }),
      );
    }
    refreshPAList();
    dispatch(setStatusDetail({} as TStatusDetail));
  };

  return (
    <Popover trigger={'hover'}>
      <PopoverTrigger>
        <Box>
          <DCButton
            h={40}
            gaClickName="dc.file.f_detail_pop.download.click"
            onClick={() => onCreatePaymentClick()}
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
  );
};
