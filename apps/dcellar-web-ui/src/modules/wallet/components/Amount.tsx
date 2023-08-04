import {
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Text,
} from '@totejs/uikit';
import React, { useCallback, useMemo } from 'react';
import { useNetwork } from 'wagmi';
import { isEmpty } from 'lodash-es';
import BigNumber from 'bignumber.js';
import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import {
  CRYPTOCURRENCY_DISPLAY_PRECISION,
  DECIMAL_NUMBER,
  MIN_AMOUNT,
  POPPINS_FONT,
  WalletOperationInfos,
} from '../constants';
import { isRightChain } from '../utils/isRightChain';
import BNBIcon from '@/public/images/icons/bnb.svg';
import { trimFloatZero } from '@/utils/trimFloatZero';
import { currencyFormatter } from '@/utils/currencyFormatter';
import { EOperation, GetFeeType, TFeeData, TWalletFromValues } from '../type';
import { useChainsBalance } from '@/context/GlobalContext/WalletBalanceContext';
import { BSC_CHAIN_ID, GREENFIELD_CHAIN_ID } from '@/base/env';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectBnbPrice, setupTmpAvailableBalance } from '@/store/slices/global';
import { useMount } from 'ahooks';

type AmountProps = {
  disabled: boolean;
  feeData: TFeeData;
  errors: FieldErrors;
  register: UseFormRegister<TWalletFromValues>;
  watch: UseFormWatch<TWalletFromValues>;
  setValue: UseFormSetValue<TWalletFromValues>;
  getGasFee?: GetFeeType;
  maxDisabled?: boolean;
};

const AmountErrors = {
  validateBalance: 'Insufficient balance.',
  validateFormat: 'Invalid amount.',
  validateNum: `The maximum precision is ${CRYPTOCURRENCY_DISPLAY_PRECISION} digits.`,
  required: 'Amount is required.',
  min: 'Please enter a minimum amount of 0.00000001.',
};

const DefaultFee = {
  transfer_in: 0.00008 + 0.002,
  transfer_out: 0.000006 + 0.001,
  send: 0.000006,
};

export const Amount = ({ register, errors, disabled, watch, feeData, setValue }: AmountProps) => {
  const dispatch = useAppDispatch();
  const bnbPrice = useAppSelector(selectBnbPrice);
  const { transType } = useAppSelector((root) => root.wallet);
  const defaultFee = DefaultFee[transType];
  const curInfo = WalletOperationInfos[transType];
  const { gasFee, relayerFee } = feeData;
  const { loginAccount: address } = useAppSelector((root) => root.persist);
  const { isLoading, all } = useChainsBalance();
  const { chain } = useNetwork();
  const isRight = useMemo(() => {
    return isRightChain(chain?.id, curInfo?.chainId);
  }, [chain?.id, curInfo?.chainId]);

  const balance = useMemo(() => {
    if (transType === EOperation.transfer_in) {
      return all.find((item) => item.chainId === BSC_CHAIN_ID)?.availableBalance || 0;
    }
    return all.find((item) => item.chainId === GREENFIELD_CHAIN_ID)?.availableBalance || 0;
  }, [all, transType]);
  useMount(() => {
    dispatch(setupTmpAvailableBalance(address));
  });

  const Balance = useCallback(() => {
    if (isLoading) return null;

    const val = trimFloatZero(
      BigNumber(balance || 0)
        .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
        .toString(DECIMAL_NUMBER),
    );
    const usdPrice = BigNumber(balance).times(BigNumber(bnbPrice));

    const unifyUsdPrice = currencyFormatter(usdPrice.toString(DECIMAL_NUMBER));
    return (
      <>
        Balance on {curInfo?.chainName}: {val} BNB ({unifyUsdPrice})
      </>
    );
  }, [balance, bnbPrice, curInfo?.chainName, isLoading]);

  // const onMaxClick = async () => {
  //   if (balance && feeData) {
  //     getGasFee && (await getGasFee({ amountIn: balance?.formatted, type: 'total_value' }));
  //     const availableBalance = BigNumber(balance.formatted)
  //       .minus(feeData.gasFee)
  //       .minus(feeData.relayerFee)
  //       .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1);
  //     const availableStr = availableBalance.toString(DECIMAL_NUMBER);
  //     setValue('amount', availableStr, { shouldValidate: true });
  //   }
  // };
  watch('amount');
  return (
    <>
      <Flex justifyContent={'space-between'}>
        <FormLabel
          fontWeight={500}
          fontSize="14px"
          lineHeight="150%"
          htmlFor="amount"
          mb={'8px'}
          display="inline-block"
          fontFamily={POPPINS_FONT}
        >
          Amount
        </FormLabel>
        {/* {isRight && (
          <Button
            variant="text"
            type="button"
            cursor={'pointer'}
            alignItems="flex-start"
            disabled={maxDisabled}
            onClick={onMaxClick}
          >
            <MaxIcon />
          </Button>
        )} */}
      </Flex>

      <FormControl isInvalid={!isEmpty(errors?.amount)}>
        <InputGroup>
          <Input
            autoComplete="off"
            border="1px solid #EAECF0"
            id="amount"
            paddingRight={'80px'}
            type={'number'}
            placeholder="0.0"
            disabled={!isRight || disabled}
            fontSize="18px"
            fontWeight={700}
            step={MIN_AMOUNT}
            height="52px"
            onKeyPress={(e) => {
              if (e.key === 'e' || e.key === '-' || e.key === '+') {
                e.preventDefault();
              }
            }}
            onPaste={(e) => {
              e.stopPropagation();
              e.preventDefault();

              const clipboardData = e.clipboardData || window.clipboardData;
              const pastedData = clipboardData.getData('Text');
              if (/^\d+(\.\d+)?$/.test(pastedData)) {
                setValue('amount', pastedData, { shouldValidate: true });

                return;
              }
              e.preventDefault();
            }}
            onWheel={(event) => event.currentTarget.blur()}
            color={!isEmpty(errors?.amount) ? '#EA412E' : '#1E2026'}
            {...register('amount', {
              required: true,
              min: MIN_AMOUNT,
              validate: {
                validateBalance: (val: string) => {
                  let totalAmount = BigNumber(0);
                  const balanceVal = BigNumber(balance || 0);
                  // TODO temp limit
                  if (transType === EOperation.send) {
                    totalAmount =
                      gasFee.toString() === '0'
                        ? BigNumber(val).plus(BigNumber(defaultFee))
                        : BigNumber(val).plus(gasFee);
                  } else {
                    totalAmount =
                      gasFee.toString() === '0' && relayerFee.toString() === '0'
                        ? BigNumber(val).plus(BigNumber(defaultFee))
                        : BigNumber(val).plus(gasFee).plus(relayerFee);
                  }

                  return !balance ? true : totalAmount.comparedTo(balanceVal) <= 0;
                },
                validateNum: (val: string) => {
                  const precisionStr = val.split('.')[1];

                  return !precisionStr || precisionStr.length <= CRYPTOCURRENCY_DISPLAY_PRECISION;
                },
              },
            })}
          />

          <InputRightElement width={'80px'} zIndex="0">
            <BNBIcon />
            <Text fontSize={'16px'} fontWeight="600" ml="8px" mr={'12px'}>
              BNB
            </Text>
          </InputRightElement>
        </InputGroup>
        <FormErrorMessage textAlign={'right'}>
          {/* @ts-ignore */}
          {AmountErrors[errors?.amount?.type]}
        </FormErrorMessage>
        <FormHelperText textAlign={'right'} color="#76808F">
          <Balance />
        </FormHelperText>
      </FormControl>
    </>
  );
};

export default Amount;
