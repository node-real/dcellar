import { Tips } from '@/components/common/Tips';
import {
  renderBalanceNumber,
  renderFeeValue,
  renderInsufficientBalance,
  renderPrelockedFeeValue,
} from '@/modules/file/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import { MsgCreateObjectTypeUrl } from '@bnb-chain/greenfield-chain-sdk';
import { Box, Fade, Flex, Slide, Text, useDisclosure } from '@totejs/uikit';
import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import { useAsyncEffect, useMount } from 'ahooks';
import { setupPreLockFeeObjects, setupTmpAvailableBalance } from '@/store/slices/global';
import { isEmpty } from 'lodash-es';
import { calPreLockFee } from '@/utils/sp';
import { MenuCloseIcon } from '@totejs/icons';

export const Fee = forwardRef((props, ref) => {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { _availableBalance: availableBalance } = useAppSelector((root) => root.global);
  const { gasObjects = {} } = useAppSelector((root) => root.global.gasHub);
  const { gasFee: singleTxGasFee } = gasObjects?.[MsgCreateObjectTypeUrl] || {};
  const { price: exchangeRate } = useAppSelector((root) => root.global.bnb);
  const { hashQueue, preLockFeeObjects } = useAppSelector((root) => root.global);
  const { primarySp } = useAppSelector((root) => root.object);
  const isChecking =
    hashQueue.some((item) => item.status === 'CHECK') || isEmpty(preLockFeeObjects);
    const { isOpen, onToggle } = useDisclosure();
  useAsyncEffect(async () => {
    if (isEmpty(preLockFeeObjects[primarySp.operatorAddress])) {
      return await dispatch(setupPreLockFeeObjects(primarySp.operatorAddress));
    }
  }, [primarySp.operatorAddress]);

  const lockFee = useMemo(() => {
    const preLockFeeObject = preLockFeeObjects[primarySp.operatorAddress];
    if (isEmpty(preLockFeeObject) || isChecking) {
      return '-1';
    }
    const size = hashQueue
      .filter((item) => item.status !== 'ERROR')
      .reduce((acc, cur) => acc + cur.size, 0);
    const lockFee = calPreLockFee({
      size,
      primarySpAddress: primarySp.operatorAddress,
      preLockFeeObject: preLockFeeObject,
    });

    return lockFee;
  }, [hashQueue, isChecking, preLockFeeObjects, primarySp?.operatorAddress]);

  const gasFee = isChecking
    ? -1
    : hashQueue.filter((item) => item.status !== 'ERROR').length * singleTxGasFee;
  useImperativeHandle(ref, () => ({
    isBalanceAvailable: Number(availableBalance) >= Number(gasFee) + Number(lockFee),
    amount: String(Number(gasFee) + Number(lockFee)),
    balance: availableBalance,
  }))
  useMount(() => {
    dispatch(setupTmpAvailableBalance(loginAccount));
  });

  const renderFee = (
    key: string,
    bnbValue: string,
    exchangeRate: number,
    keyIcon?: React.ReactNode,
  ) => {
    return (
      <Flex w="100%" alignItems={'center'} justifyContent={'space-between'}>
        <Flex alignItems="center" mb="4px">
          <Text
            fontSize={'14px'}
            lineHeight={'17px'}
            fontWeight={400}
            color={'readable.tertiary'}
            as="p"
          >
            {key}
          </Text>
          {keyIcon && (
            <Box ml="6px" mt={'-1px'}>
              {keyIcon}
            </Box>
          )}
        </Flex>
        <Text fontSize={'14px'} lineHeight={'17px'} fontWeight={400} color={'readable.tertiary'}>
          {key === 'Pre-locked storage fee'
            ? renderPrelockedFeeValue(bnbValue, exchangeRate)
            : renderFeeValue(bnbValue, exchangeRate)}
        </Text>
      </Flex>
    );
  };

  return (
    <Flex flexDirection={'column'} w="100%" padding={'8px'} bg={'bg.secondary'} borderRadius="12px">
      <Flex
        paddingBottom={'4px'}
        fontSize={'14px'}
        fontWeight={600}
        onClick={onToggle}
        justifyContent={'space-between'}
        alignItems={'center'}
        cursor={'pointer'}
      >
        <Text>Total Fees</Text>
        <Text justifySelf={'flex-end'}>
          {renderFeeValue(String(Number(gasFee) + Number(lockFee)), exchangeRate)}
          <MenuCloseIcon sx={{
          transform: isOpen? 'rotate(180deg)': 'rotate(0deg)',
        }}/>
        </Text>

      </Flex>
      <Box borderTop="1px solid #AEB4BC" display={isOpen? 'none': 'block'}>
      <Flex display={'flex'} flexDirection={'column'} gap={'4px'} paddingTop={'4px'}>
        {renderFee(
          'Pre-locked storage fee',
          lockFee,
          +exchangeRate,
          <Tips
            iconSize={'14px'}
            containerWidth={'308px'}
            tips={
              <Box width={'308px'} p="8px 12px">
                <Box
                  color={'readable.normal'}
                  fontSize="14px"
                  lineHeight="1.5"
                  wordBreak={'break-word'}
                >
                  <Box as="p">
                    For uploading and storing files, besides transaction fee, Greenfield will
                    prelock a certain amount of BNB and charge the storage fee by a certain flow
                    rate.
                  </Box>
                </Box>
              </Box>
            }
          />,
        )}
        {renderFee('Gas fee', gasFee + '', +exchangeRate)}
      </Flex>
      <Flex w={'100%'} justifyContent={'space-between'} >
        {/*todo correct the error showing logics*/}
        <Text fontSize={'12px'} lineHeight={'16px'} color={'scene.danger.normal'}>
          {!isChecking &&
            renderInsufficientBalance(gasFee + '', lockFee, availableBalance || '0', {
              gaShowName: 'dc.file.upload_modal.transferin.show',
              gaClickName: 'dc.file.upload_modal.transferin.click',
            })}
        </Text>
        <Text fontSize={'12px'} lineHeight={'16px'} color={'readable.disabled'}>
          Available balance: {renderBalanceNumber(availableBalance || '0')}
        </Text>
        </Flex>
        </Box>
    </Flex>
  );
});

export default Fee;
