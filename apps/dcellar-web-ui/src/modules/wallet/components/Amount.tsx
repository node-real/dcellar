import {
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Link,
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
  WalletOperationInfos,
} from '../constants';
import { isRightChain } from '../utils/isRightChain';
import { EOperation, GetFeeType, TFeeData, TWalletFromValues } from '../type';
import { useChainsBalance } from '@/context/GlobalContext/WalletBalanceContext';
import { useAppSelector } from '@/store';
import { selectBnbPrice } from '@/store/slices/global';
import { TxType } from '../Send';
import { trimFloatZero } from '@/utils/string';
import { currencyFormatter } from '@/utils/formatter';
import { BN } from '@/utils/math';
import { IconFont } from '@/components/IconFont';
import { displayTokenSymbol } from '@/utils/wallet';

type AmountProps = {
  disabled: boolean;
  feeData: TFeeData;
  errors: FieldErrors;
  register: UseFormRegister<TWalletFromValues>;
  watch: UseFormWatch<TWalletFromValues>;
  setValue: UseFormSetValue<TWalletFromValues>;
  getGasFee?: GetFeeType;
  maxDisabled?: boolean;
  txType?: TxType;
  balance: string;
};

const AmountErrors = {
  validateBalance: 'Insufficient balance.',
  validateFormat: 'Invalid amount.',
  validateNum: `The maximum precision is ${CRYPTOCURRENCY_DISPLAY_PRECISION} digits.`,
  required: 'Amount is required.',
  min: 'Please enter a minimum amount of 0.00000001.',
  withdrawError: (
    <>
      No withdrawals allowed over 100 {displayTokenSymbol()}.{' '}
      <Link
        href="#"
        color="readable.danger"
        _hover={{ color: 'readable.danger' }}
        textDecoration={'underline'}
      >
        Learn More
      </Link>
    </>
  ),
};

const DefaultFee = {
  transfer_in: 0.00008 + 0.002,
  transfer_out: 0.000006 + 0.001,
  send: 0.000006,
};

export const Amount = ({
  register,
  errors,
  disabled,
  watch,
  balance,
  feeData,
  setValue,
  txType,
}: AmountProps) => {
  const bnbPrice = useAppSelector(selectBnbPrice);
  const { transType } = useAppSelector((root) => root.wallet);
  const defaultFee = DefaultFee[transType];
  const curInfo = WalletOperationInfos[transType];
  const { gasFee, relayerFee } = feeData;
  const { isLoading } = useChainsBalance();
  const { chain } = useNetwork();
  const isRight = useMemo(() => {
    return isRightChain(chain?.id, curInfo?.chainId);
  }, [chain?.id, curInfo?.chainId]);
  const isSendPage = transType === 'send';

  const Balance = useCallback(() => {
    if (isLoading) return null;

    const val = trimFloatZero(
      BigNumber(balance || 0)
        .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
        .toString(DECIMAL_NUMBER),
    );
    const usdPrice = BigNumber(balance || 0).times(BigNumber(bnbPrice));

    const unifyUsdPrice = currencyFormatter(usdPrice.toString(DECIMAL_NUMBER));
    return (
      <>
        Balance on {curInfo?.chainName}: {val} {displayTokenSymbol()} ({unifyUsdPrice})
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
          htmlFor="amount"
          mb={'8px'}
          display="inline-block"
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
            fontWeight="700 !important"
            step={MIN_AMOUNT}
            height="44px"
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
                  return totalAmount.comparedTo(balanceVal) <= 0;
                },
                validateNum: (val: string) => {
                  const precisionStr = val.split('.')[1];

                  return !precisionStr || precisionStr.length <= CRYPTOCURRENCY_DISPLAY_PRECISION;
                },
                withdrawError: (val: string) => {
                  if (!txType || txType !== 'withdraw_from_payment_account') return true;
                  return BN(val).lt(100);
                },
              },
            })}
          />

          <InputRightElement width={'80px'} zIndex="0">
            <IconFont type={'bnb'} color="#F0B90B" w={24} />
            <Text fontSize={'14px'} fontWeight="600" ml="4px" mr={'12px'}>
              {displayTokenSymbol()}
            </Text>
          </InputRightElement>
        </InputGroup>
        <FormErrorMessage textAlign={'right'}>
          {/* @ts-ignore */}
          {AmountErrors[errors?.amount?.type]}
        </FormErrorMessage>
        {!isSendPage && (
          <FormHelperText mt={8} textAlign={'right'} color="#76808F">
            <Balance />
          </FormHelperText>
        )}
      </FormControl>
    </>
  );
};

export default Amount;
