import { GREENFIELD_CHAIN_ID } from '@/base/env';
import { IconFont } from '@/components/IconFont';
import { RenewalGuideModal } from '@/components/RenewalNotification/RenewalGuideModal';
import { InternalRoutePaths } from '@/constants/paths';
import { MIN_AMOUNT } from '@/modules/wallet/constants';
import { useAppDispatch, useAppSelector } from '@/store';
import { EStreamRecordStatus, selectPaymentAccounts } from '@/store/slices/accounts';
import { setCloseRenewalAddresses } from '@/store/slices/session-persist';
import { displayTokenSymbol } from '@/utils/wallet';
import { Box, Button, Flex, useDisclosure } from '@node-real/uikit';
import { fetchBalance } from '@wagmi/core';
import { useAsyncEffect } from 'ahooks';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import { isEmpty } from 'lodash-es';
import { useRouter } from 'next/router';
import { ReactNode, useMemo, useState } from 'react';

export type RenewalNotificationProps = {
  address?: string;
};

export const RenewalNotification = ({ address }: RenewalNotificationProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const _bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);
  const [bankBalance, setBankBalance] = useState<null | string>(null);
  const accountInfos = useAppSelector((root) => root.accounts.accountInfos);
  const { reserveTime } = useAppSelector((root) => root.global.storeFeeParams);
  const paymentAccountList = useAppSelector(selectPaymentAccounts(loginAccount));
  const closeRenewalAddresses = useAppSelector((root) => root.sessionPersist.closeRenewalAddresses);

  useAsyncEffect(async () => {
    if (!loginAccount) return;
    const data = await fetchBalance({
      address: loginAccount as `0x${string}`,
      chainId: GREENFIELD_CHAIN_ID,
    });
    setBankBalance(data.formatted);
  }, [loginAccount, _bankBalance]);

  const notifications = useMemo(() => {
    const nodes: { type: 'danger' | 'warning'; node: ReactNode }[] = [];
    const onNavDeposit = (address: string) => {
      const isOwner = address.toLowerCase() === loginAccount.toLowerCase();
      if (isOwner) {
        return onOpen();
      }

      return router.push(
        `${InternalRoutePaths.wallet}?type=send&from=${loginAccount}&to=${address}`,
      );
    };
    const onCloseNotification = (address: string) => {
      dispatch(setCloseRenewalAddresses([...closeRenewalAddresses, address]));
    };

    const ownAccounts = [loginAccount, ...paymentAccountList.map((item) => item.address)];
    if ((address && !accountInfos[address]) || bankBalance === null || isEmpty(accountInfos)) {
      return nodes;
    }
    const accounts = (address ? [address] : ownAccounts).filter((item) => !!item) || [];

    for (const _account of accounts) {
      const item = accountInfos[_account];

      if (!item || closeRenewalAddresses.includes(item.address)) {
        continue;
      }

      if (item.status === EStreamRecordStatus.FROZEN) {
        const renewalStoreFee = BigNumber(item.frozenNetflowRate).times(reserveTime).abs();
        const node = (
          <Flex justifyContent={'space-between'} w={'100%'} alignItems={'center'}>
            <Flex gap={'4px'}>
              <Flex alignItems={'center'} h={20}>
                <IconFont type={'colored-error2'} w={'16'} />
              </Flex>
              <Box fontSize={'14px'} lineHeight={'20px'}>
                Your{' '}
                <Box as="span" fontWeight={600}>
                  {item.name}
                </Box>{' '}
                is frozen, associated storage services are currently limited. To avoid data loss,
                please deposit at least{' '}
                <Box fontWeight={600} as="span">
                  {renewalStoreFee.isLessThan(MIN_AMOUNT)
                    ? MIN_AMOUNT
                    : renewalStoreFee.toFixed(8, 0)}{' '}
                  {displayTokenSymbol()}
                </Box>{' '}
                to reactive.{' '}
                <Button
                  variant="link"
                  onClick={() => onNavDeposit(item.address)}
                  fontWeight={400}
                  fontSize={'14px'}
                  textDecoration={'underline'}
                >
                  Deposit Now
                </Button>
              </Box>
            </Flex>
            <IconFont
              cursor={'pointer'}
              onClick={() => {
                onCloseNotification(item.address);
              }}
              color="readable.secondary"
              type="close"
              w={'16'}
            />
          </Flex>
        );
        nodes.push({ type: 'danger', node });
        continue;
      }

      // The purpose of settle is to lock in the costs for the next 6 months. At the time of settleTime, the user's costs from the last settlement (crudtimeStamp) to the current time will be deducted, primarily using the payment's buffer balance. If the storage price changes during the storage period, causing the buffer balance to be insufficient to cover the deduction, the remaining amount will be paid from the static balance. The future 6 months' costs also need to be locked in by transferring from the static balance/bank balance to the buffer balance.
      const nextStoreFee = BigNumber(item.netflowRate).times(reserveTime).abs();
      const curExtraFee = BigNumber(item.bufferBalance)
        .minus(
          BigNumber(item.netflowRate)
            .abs()
            .times(dayjs().unix() - item.crudTimestamp),
        )
        .isPositive()
        ? 0
        : BigNumber(item.bufferBalance)
            .minus(
              BigNumber(item.netflowRate)
                .abs()
                .times(dayjs().unix() - item.crudTimestamp),
            )
            .abs();
      const fee = nextStoreFee.plus(curExtraFee);
      const isOwnerAccount = item.address.toLowerCase() === loginAccount.toLowerCase();
      const lessThan7Days =
        item.settleTimestamp !== 0
          ? item.settleTimestamp - dayjs().unix() < 7 * 24 * 60 * 60
          : false;
      const notPayNextFee = isOwnerAccount
        ? BigNumber(item.staticBalance).plus(bankBalance).isLessThan(fee)
        : BigNumber(item.staticBalance).isLessThan(fee);

      if (lessThan7Days && notPayNextFee) {
        const node = (
          <Flex justifyContent={'space-between'} w={'100%'} alignItems={'center'}>
            <Flex gap={'4px'}>
              <Flex alignItems={'center'} h={20}>
                <IconFont type={'warning'} w={'16'} />
              </Flex>
              <Box fontSize={'14px'}>
                Your{' '}
                <Box as="span" fontWeight={600}>
                  {item.name}
                </Box>{' '}
                is estimated to settle on {dayjs(item.settleTimestamp * 1000).format('MMM-DD-YYYY')}
                . To avoid account freezing and potential data loss, please deposit at least{' '}
                <Box fontWeight={600} as="span">
                  {fee.isLessThan(MIN_AMOUNT) ? MIN_AMOUNT : fee.toFixed(8, 0)}{' '}
                  {displayTokenSymbol()}
                </Box>{' '}
                into your payment account or associated owner account.{' '}
                <Button
                  variant="link"
                  onClick={() => onNavDeposit(item.address)}
                  fontWeight={400}
                  fontSize={'14px'}
                  textDecoration={'underline'}
                >
                  Deposit Now
                </Button>
              </Box>
            </Flex>
            <IconFont
              cursor={'pointer'}
              onClick={() => {
                onCloseNotification(item.address);
              }}
              color="readable.secondary"
              type="close"
              w={'16'}
            />
          </Flex>
        );
        nodes.push({ type: 'warning', node });
      }
    }
    return nodes;
  }, [
    loginAccount,
    paymentAccountList,
    address,
    accountInfos,
    bankBalance,
    router,
    onOpen,
    dispatch,
    closeRenewalAddresses,
    reserveTime,
  ]);

  return (
    <>
      <Flex flexDirection={'column'} gap={16} mb={16}>
        {notifications.map((item, index) => (
          <Flex
            key={index}
            color={item.type === 'danger' ? '#CA300E' : 'readable.label-normal'}
            bgColor={item.type === 'danger' ? 'rgba(238, 57, 17, 0.1)' : 'opacity3'}
            borderRadius={4}
            padding={'8px 12px'}
            gap={12}
          >
            {item.node}
          </Flex>
        ))}
      </Flex>
      <RenewalGuideModal isOpen={isOpen} onClose={onClose} />
    </>
  );
};
