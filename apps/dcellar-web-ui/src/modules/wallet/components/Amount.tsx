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
} from '@node-real/uikit';
import BigNumber from 'bignumber.js';
import { isEmpty } from 'lodash-es';
import { useCallback, useMemo } from 'react';
import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { useAccount, useNetwork } from 'wagmi';

import { MaxButton } from './MaxButton';
import {
  CRYPTOCURRENCY_DISPLAY_PRECISION,
  DECIMAL_NUMBER,
  DefaultTransferFee,
  MIN_AMOUNT,
  WalletOperationInfos,
} from '../constants';
import { TxType } from '../Send';
import { EOperation, TFeeData, TWalletFromValues } from '../type';
import { setMaxAmount } from '../utils/common';
import { isRightChain } from '../utils/isRightChain';

import { IconFont } from '@/components/IconFont';
import { useChainsBalance } from '@/context/GlobalContext/WalletBalanceContext';
import { ErrorResponse } from '@/facade/error';
import { useAppSelector } from '@/store';
import { selectBnbUsdtExchangeRate } from '@/store/slices/global';
import { currencyFormatter } from '@/utils/formatter';
import { BN } from '@/utils/math';
import { trimFloatZero } from '@/utils/string';
import { displayTokenSymbol } from '@/utils/wallet';

type AmountProps = {
  disabled: boolean;
  feeData: TFeeData;
  errors: FieldErrors;
  bankBalance?: string;
  settlementFee?: string;
  refreshFee?: (transferAmount: string) => Promise<ErrorResponse | [TFeeData, null]>;
  register: UseFormRegister<TWalletFromValues>;
  watch: UseFormWatch<TWalletFromValues>;
  setValue: UseFormSetValue<TWalletFromValues>;
  maxDisabled?: boolean;
  txType?: TxType;
  balance: string;
};

const AmountErrors = {
  validateWithdrawStaticBalance:
    "The payment account doesn't have enough balance to pay settlement fee.",
  validateWithdrawBankBalance: "The owner account doesn't have enough balance to pay gas fee.",
  validateBalance: 'Insufficient balance.',
  validateFormat: 'Invalid amount.',
  validatePrecision: `The maximum precision is ${CRYPTOCURRENCY_DISPLAY_PRECISION} digits.`,
  required: 'Amount is required.',
  min: 'Please enter a minimum amount of 0.00000001.',
  validateWithdrawMaxAmountError: (
    <>
      No withdrawals allowed over 100 {displayTokenSymbol()}.{' '}
      <Link
        href="https://docs.nodereal.io/docs/dcellar-faq#wallet-related"
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
  balance,
  txType,
  feeData,
  disabled,
  errors,
  maxDisabled,
  bankBalance,
  settlementFee,
  register,
  refreshFee,
  watch,
  setValue,
}: AmountProps) => {
  const transferType = useAppSelector((root) => root.wallet.transferType);

  const exchangeRate = useAppSelector(selectBnbUsdtExchangeRate);
  const { isLoading } = useChainsBalance();
  const { chain } = useNetwork();
  const { connector } = useAccount();

  const defaultFee = DefaultFee[transferType];
  const curInfo = WalletOperationInfos[transferType];
  const { gasFee, relayerFee } = feeData;
  const isSendPage = transferType === 'send';

  const isShowMaxButton = useMemo(() => {
    return isRightChain(chain?.id, curInfo?.chainId);
  }, [chain?.id, curInfo?.chainId]);

  const Balance = useCallback(() => {
    if (isLoading) return null;

    const val = trimFloatZero(
      BigNumber(balance || 0)
        .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
        .toString(DECIMAL_NUMBER),
    );
    const usdPrice = BigNumber(balance || 0).times(BigNumber(exchangeRate));

    const unifyUsdPrice = currencyFormatter(usdPrice.toString(DECIMAL_NUMBER));
    return (
      <>
        Balance on {curInfo?.chainName}: {val} {displayTokenSymbol()} ({unifyUsdPrice})
      </>
    );
  }, [balance, exchangeRate, curInfo?.chainName, isLoading]);

  const onMaxClick = async () => {
    if (!balance || !feeData) return setValue('amount', '0', { shouldValidate: true });
    if (txType === 'withdraw_from_payment_account') {
      const cal = BN(balance)
        .minus(settlementFee || '0')
        .dp(CRYPTOCURRENCY_DISPLAY_PRECISION, 1)
        .toString();
      const maxAmount = BN(cal).lt(0) ? '0' : cal;

      return setValue('amount', maxAmount, {
        shouldValidate: true,
      });
    }

    if (transferType === 'transfer_in' && refreshFee) {
      const [realTimeFee, error] = await refreshFee(
        BN(balance).minus(DefaultTransferFee.transfer_in.total).toString(),
      );
      const isTwTransferMax = connector && connector.id.toLowerCase() === 'trust';
      realTimeFee && setMaxAmount(balance, realTimeFee, setValue, isTwTransferMax);
      return;
    }

    setMaxAmount(balance, feeData, setValue);
  };

  const validateBalance = (val: string) => {
    if (txType === 'withdraw_from_payment_account') {
      return BN(balance).isGreaterThanOrEqualTo(BN(val).plus(settlementFee || '0'));
    }

    let totalAmount = BigNumber(0);
    const balanceVal = BigNumber(balance || 0);
    if (transferType === EOperation.send) {
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

    return balanceVal.isGreaterThanOrEqualTo(totalAmount);
  };

  const validatePrecision = (val: string) => {
    const precisionStr = val.split('.')[1];
    return !precisionStr || precisionStr.length <= CRYPTOCURRENCY_DISPLAY_PRECISION;
  };

  const validateWithdrawBankBalance = () => {
    if (txType !== 'withdraw_from_payment_account') return true;
    return BN(bankBalance as string).isGreaterThanOrEqualTo(gasFee);
  };

  const validateWithdrawMaxAmountError = (val: string) => {
    if (txType !== 'withdraw_from_payment_account') return true;
    return BN(val).lt(100);
  };

  const validateWithdrawStaticBalance = (val: string) => {
    if (txType !== 'withdraw_from_payment_account') return true;
    return BN(balance).isGreaterThanOrEqualTo(BN(settlementFee || '0').plus(val));
  };

  const onPaste = (e: any) => {
    e.stopPropagation();
    e.preventDefault();

    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedData = clipboardData.getData('Text');
    if (/^\d+(\.\d+)?$/.test(pastedData)) {
      return setValue('amount', pastedData, { shouldValidate: true });
    }
    e.preventDefault();
  };

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
        {isShowMaxButton && <MaxButton disabled={maxDisabled} onMaxClick={onMaxClick} />}
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
            disabled={disabled}
            fontSize="18px"
            fontWeight="700 !important"
            step={MIN_AMOUNT}
            height="44px"
            onKeyPress={(e) => {
              if (e.key === 'e' || e.key === '-' || e.key === '+') {
                e.preventDefault();
              }
            }}
            onPaste={onPaste}
            onWheel={(event) => event.currentTarget.blur()}
            color={!isEmpty(errors?.amount) ? '#EA412E' : '#1E2026'}
            {...register('amount', {
              required: true,
              min: MIN_AMOUNT,
              validate: {
                validateWithdrawBankBalance,
                validateWithdrawStaticBalance,
                validateBalance,
                validatePrecision,
                validateWithdrawMaxAmountError,
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
          {/* @ts-expect-error TODO */}
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
