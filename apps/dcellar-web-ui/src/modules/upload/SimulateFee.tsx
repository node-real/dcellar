import { Tips } from '@/components/common/Tips';
import {
  renderBalanceNumber,
  renderFeeValue,
  renderInsufficientBalance,
  renderPrelockedFeeValue,
} from '@/modules/file/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  MsgCreateObjectTypeUrl,
  MsgGrantAllowanceTypeUrl,
  MsgPutPolicyTypeUrl,
} from '@bnb-chain/greenfield-js-sdk';
import { Box, Flex, Text, useDisclosure, Link } from '@totejs/uikit';
import React, { useEffect, useMemo } from 'react';
import { useAsyncEffect, useMount } from 'ahooks';
import { WaitFile, setupPreLockFeeObjects, setupTmpAvailableBalance } from '@/store/slices/global';
import { isEmpty } from 'lodash-es';
import { calPreLockFee } from '@/utils/sp';
import { MenuCloseIcon } from '@totejs/icons';
import { setEditUpload } from '@/store/slices/object';
import BigNumber from 'bignumber.js';
import { DECIMAL_NUMBER } from '../wallet/constants';

export const Fee = () => {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { _availableBalance: availableBalance } = useAppSelector((root) => root.global);
  const { gasObjects = {} } = useAppSelector((root) => root.global.gasHub);
  const { gasFee: singleTxGasFee } = gasObjects?.[MsgCreateObjectTypeUrl] || {};
  const { price: exchangeRate } = useAppSelector((root) => root.global.bnb);
  const { waitQueue, preLockFeeObjects } = useAppSelector((root) => root.global);
  const { bucketName } = useAppSelector((root) => root.object);
  const { primarySpInfo } = useAppSelector((root) => root.sp);
  const isChecking =
    waitQueue.some((item) => item.status === 'CHECK') || isEmpty(preLockFeeObjects);
  const { isOpen, onToggle } = useDisclosure();
  const primarySp = primarySpInfo[bucketName];
  useAsyncEffect(async () => {
    if (!primarySp?.operatorAddress) return;
    if (isEmpty(preLockFeeObjects[primarySp.operatorAddress])) {
      return await dispatch(setupPreLockFeeObjects(primarySp.operatorAddress));
    }
  }, [primarySp?.operatorAddress]);

  const createTmpAccountGasFee = useMemo(() => {
    const grantAllowTxFee = BigNumber(gasObjects[MsgGrantAllowanceTypeUrl].gasFee).plus(
      BigNumber(gasObjects[MsgGrantAllowanceTypeUrl].perItemFee).times(1),
    );
    const putPolicyTxFee = BigNumber(gasObjects[MsgPutPolicyTypeUrl].gasFee);

    return grantAllowTxFee.plus(putPolicyTxFee).toString(DECIMAL_NUMBER);
  }, [gasObjects]);

  const lockFee = useMemo(() => {
    if (!primarySp?.operatorAddress) return;
    const preLockFeeObject = preLockFeeObjects[primarySp.operatorAddress];
    if (isEmpty(preLockFeeObject) || isChecking) {
      return '-1';
    }
    const calRes = waitQueue
      .filter((item) => item.status !== 'ERROR')
      .reduce(
        (sum, obj) =>
          sum.plus(
            BigNumber(
              calPreLockFee({
                size: obj.size || 0,
                primarySpAddress: primarySp.operatorAddress,
                preLockFeeObject: preLockFeeObject,
              }),
            ),
          ),
        BigNumber(0),
      )
      .toString();

    return calRes;
  }, [waitQueue, isChecking, preLockFeeObjects, primarySp?.operatorAddress]);

  const gasFee = isChecking
    ? -1
    : BigNumber(waitQueue.filter((item: WaitFile) => item.status !== 'ERROR').length)
        .times(singleTxGasFee)
        .plus(BigNumber(createTmpAccountGasFee).toString(DECIMAL_NUMBER))
        .toString(DECIMAL_NUMBER);

  useEffect(() => {
    if (gasFee && lockFee) {
      dispatch(
        setEditUpload({
          gasFee: BigNumber(gasFee).toString(DECIMAL_NUMBER),
          preLockFee: BigNumber(lockFee).toString(DECIMAL_NUMBER),
          totalFee: BigNumber(gasFee).plus(BigNumber(lockFee)).toString(DECIMAL_NUMBER),
          isBalanceAvailable: BigNumber(availableBalance)
            .minus(BigNumber(gasFee))
            .minus(BigNumber(lockFee))
            .isPositive(),
        }),
      );
    }
  }, [availableBalance, dispatch, gasFee, lockFee]);
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
    <Flex flexDirection={'column'} w="100%" padding={'8px'} bg={'bg.secondary'} borderRadius="4px">
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
        <Text justifySelf={'flex-end'} fontWeight={'normal'}>
          {renderFeeValue(String(Number(gasFee) + Number(lockFee)), exchangeRate)}
          <MenuCloseIcon
            sx={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </Text>
      </Flex>
      <Box borderTop="1px solid #AEB4BC" display={isOpen ? 'none' : 'block'}>
        <Flex display={'flex'} flexDirection={'column'} gap={'4px'} paddingTop={'4px'}>
          {renderFee(
            'Pre-locked storage fee',
            lockFee + '',
            +exchangeRate,
            <Tips
              iconSize={'14px'}
              containerWidth={'308px'}
              tips={
                <Box width={'308px'} p="0px 7px">
                  <Box
                    color={'readable.normal'}
                    fontSize="14px"
                    lineHeight="1.5"
                    wordBreak={'break-word'}
                  >
                    <Box as="p">
                      To upload and store objects on Greenfield, in addition to the transaction fee,
                      a certain amount of BNB will be pre-locked for 6 months of storage. The
                      storage fee will be charged based on the flow rate.{' '}
                      <Link
                        href="https://docs.nodereal.io/docs/dcellar-faq#fee-related"
                        target="_blank"
                        color="readable.primary"
                        textDecoration="underline"
                        _hover={{ color: 'readable.brand5' }}
                      >
                        Learn more
                      </Link>
                    </Box>
                  </Box>
                </Box>
              }
            />,
          )}
          {renderFee('Gas fee', gasFee + '', +exchangeRate)}
        </Flex>
        <Flex w={'100%'} justifyContent={'space-between'}>
          {/*todo correct the error showing logics*/}
          <Text fontSize={'12px'} lineHeight={'16px'} color={'scene.danger.normal'}>
            {!isChecking &&
              renderInsufficientBalance(gasFee + '', lockFee + '', availableBalance || '0', {
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
};

export default Fee;
