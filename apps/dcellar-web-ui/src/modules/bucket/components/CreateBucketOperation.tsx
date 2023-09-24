import {
  Box,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Text,
  toast,
} from '@totejs/uikit';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAccount } from 'wagmi';
import { debounce, isEmpty } from 'lodash-es';
import BigNumber from 'bignumber.js';

import { Tips } from '@/components/common/Tips';
import { MIN_AMOUNT } from '@/modules/wallet/constants';
import { DCButton } from '@/components/common/DCButton';
import { SPSelector } from './SPSelector';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { CreateBucketApprovalRequest, MsgCreateBucketTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { ChainVisibilityEnum } from '@/modules/object/type';
import { useAppDispatch, useAppSelector } from '@/store';
import { SpItem } from '@/store/slices/sp';
import { getSpOffChainData } from '@/store/slices/persist';
import { useAsyncEffect } from 'ahooks';
import { selectStoreFeeParams, setupStoreFeeParams } from '@/store/slices/global';
import { PaymentAccountSelector } from '@/modules/bucket/components/PaymentAccountSelector';
import { selectAccount, setupAccountDetail, TAccount } from '@/store/slices/accounts';
import { QuotaItem } from '@/components/formitems/QuotaItem';
import { G_BYTES } from '@/utils/constant';
import { getQuotaNetflowRate } from '@/utils/payment';
import { TotalFees } from '@/modules/object/components/TotalFees';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { selectBucketList, setupBuckets } from '@/store/slices/bucket';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import { BUTTON_GOT_IT, PENDING_ICON_URL, WALLET_CONFIRM } from '@/modules/object/constant';
import { E_GET_GAS_FEE_LACK_BALANCE_ERROR, E_OFF_CHAIN_AUTH, E_UNKNOWN } from '@/facade/error';
import { createBucket, pollingGetBucket, simulateCreateBucket } from '@/facade/bucket';
import { OBJECT_ERROR_TYPES, ObjectErrorType } from '@/modules/object/ObjectError';
import { BN } from '@/utils/math';
import { reportEvent } from '@/utils/gtag';
import { PaymentInsufficientBalance } from '@/modules/object/utils';

type ValidateNameAndGas = {
  isValidating: boolean;
  gas: {
    available: boolean;
    value: BigNumber | null;
  };
  name: {
    available: boolean;
    value: string | null;
  };
};

const initValidateNameAndGas = {
  isValidating: false,
  gas: {
    available: true,
    value: null,
  },
  name: {
    available: true,
    value: null,
  },
};

interface CreateBucketOperationProps {
  onClose?: () => void;
}

export const CreateBucketOperation = memo<CreateBucketOperationProps>(function CreateOperation({
  onClose = () => {},
}) {
  const dispatch = useAppDispatch();
  const { loginAccount: address } = useAppSelector((root) => root.persist);
  const bucketList = useAppSelector(selectBucketList(address));
  const { isLoadingDetail } = useAppSelector((root) => root.accounts);
  const { spInfo, oneSp } = useAppSelector((root) => root.sp);
  const globalSP = spInfo[oneSp];
  const selectedSpRef = useRef<SpItem>(globalSP);
  const selectedPaRef = useRef<TAccount>({} as TAccount);
  const { connector } = useAccount();
  const { bankBalance } = useAppSelector((root) => root.accounts);
  const balance = useMemo(() => BigNumber(bankBalance || 0), [bankBalance]);
  const [chargeQuota, setChargeQuota] = useState(0);
  const nonceRef = useRef(0);
  const { gasObjects = {} } = useAppSelector((root) => root.global.gasHub);
  const { gasFee } = gasObjects?.[MsgCreateBucketTypeUrl] || {};
  const storeFeeParams = useAppSelector(selectStoreFeeParams);
  const [validateNameAndGas, setValidateNameAndGas] =
    useState<ValidateNameAndGas>(initValidateNameAndGas);
  // pending, operating, failed
  const { setOpenAuthModal } = useOffChainAuth();
  const PaymentAddress = selectedPaRef.current.address;
  const { settlementFee } = useSettlementFee(PaymentAddress);
  const accountDetail = useAppSelector(selectAccount(PaymentAddress));
  const [balanceEnough, setBalanceEnough] = useState(true);

  useAsyncEffect(async () => {
    if (!isEmpty(storeFeeParams)) return;
    dispatch(setupStoreFeeParams());
  }, [dispatch]);

  const quotaFee = useMemo(() => {
    if (isEmpty(storeFeeParams)) return '-1';
    const netflowRate = getQuotaNetflowRate(chargeQuota * G_BYTES, storeFeeParams);
    return BN(netflowRate)
      .times(storeFeeParams.reserveTime)
      .dividedBy(10 ** 18)
      .toString();
  }, [storeFeeParams, chargeQuota]);

  const {
    handleSubmit,
    register,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<{ bucketName: string }>({
    mode: 'onChange',
  });

  const bucketName = getValues('bucketName');

  const validateNameRules = (value: string) => {
    const types: { [key: string]: string } = {};
    if (balance.comparedTo(BigNumber(MIN_AMOUNT)) < 0) {
      types['validateBalance'] = '';
    }

    if (value === '') {
      types['required'] = 'Bucket Name is required';
    }
    if (value !== '' && !/^.{3,63}$/.test(value)) {
      types['validateLen'] = 'Must be between 3 to 63 characters long.';
    }
    // if (value !== '' && !/^[a-z0-9.-]+$/.test(value)) {
    if (value !== '' && !/^[a-z0-9-]+$/.test(value)) {
      types['validateChar'] = 'Consist only of lowercase letters, numbers, and hyphens (-).';
    }
    if (value !== '' && !/^[a-zA-Z0-9].*[a-zA-Z0-9]$/.test(value)) {
      types['validateStartEnd'] = 'Begin and end with a letter or number.';
    }
    if (bucketList.some((bucket) => bucket.BucketName === value)) {
      types['validateName'] = 'This name is already taken, try another one.';
    }
    return types;
  };

  const onError = (type: string) => {
    if (type === E_OFF_CHAIN_AUTH) {
      return setOpenAuthModal();
    }
    const errorData = OBJECT_ERROR_TYPES[type as ObjectErrorType]
      ? OBJECT_ERROR_TYPES[type as ObjectErrorType]
      : OBJECT_ERROR_TYPES[E_UNKNOWN];
    dispatch(
      setStatusDetail({
        ...errorData,
        buttonText: BUTTON_GOT_IT,
        extraParams: [bucketName],
      }),
    );
  };

  const onValidateError = (message: string, value: string) => {
    const types: { [key: string]: string } = {};
    const result: any = {
      ...validateNameAndGas,
      isLoading: false,
    };

    if (message === E_OFF_CHAIN_AUTH) {
      setValidateNameAndGas((v) => ({ ...v, isValidating: false }));
      return setOpenAuthModal();
    }

    if (message.includes('Bucket already exists') || message.includes('repeated bucket')) {
      result['name'] = {
        available: false,
        value: value,
      };
      types['validateName'] = 'This name is already taken, try another one.';
    } else if (message === E_GET_GAS_FEE_LACK_BALANCE_ERROR) {
      result['gas'] = {
        available: false,
        value: BigNumber(0),
      };
      types['validateBalance'] = '';
    } else {
      types['validateBalanceAndName'] = message;
    }

    setError('bucketName', { types });
    setValidateNameAndGas(result);
  };

  const debounceValidate = debounce(async (value, curNonce) => {
    if (curNonce !== nonceRef.current) return;

    clearErrors();
    const bucketName = value;
    setValidateNameAndGas({ ...validateNameAndGas, isValidating: true });
    const sp = selectedSpRef.current;
    const { seedString } = await dispatch(getSpOffChainData(address, sp.operatorAddress));
    const createBucketPayload: CreateBucketApprovalRequest = {
      bucketName,
      creator: address,
      visibility: ChainVisibilityEnum.VISIBILITY_TYPE_PUBLIC_READ,
      chargedReadQuota: String(chargeQuota * G_BYTES),
      spInfo: {
        primarySpAddress: sp.operatorAddress,
      },
      paymentAddress: address,
    };
    const [simulateInfo, error] = await simulateCreateBucket(createBucketPayload, {
      type: 'EDDSA',
      domain: window.location.origin,
      seed: seedString,
      address,
    });

    if (!simulateInfo) {
      if (curNonce !== nonceRef.current) return;
      return onValidateError(error, value);
    }

    const decimalGasFee = simulateInfo?.gasFee;
    if (curNonce !== nonceRef.current) {
      setValidateNameAndGas(validateNameAndGas);
      return;
    }

    setValidateNameAndGas({
      isValidating: false,
      gas: {
        available: true,
        value: BigNumber(decimalGasFee),
      },
      name: {
        available: true,
        value: value,
      },
    });
  }, 500);

  const checkGasFee = useCallback(
    (value: string) => {
      setValidateNameAndGas(initValidateNameAndGas);
      debounceValidate && debounceValidate.cancel();
      const curNonce = nonceRef.current + 1;
      nonceRef.current = curNonce;

      debounceValidate(value, curNonce);
    },
    [debounceValidate],
  );

  const handleInputChange = useCallback(
    (event: any) => {
      const value = event.target.value;
      setValue('bucketName', value);

      // 1. validate name rules
      const types = validateNameRules(value);
      if (Object.values(types).length > 0) {
        setError('bucketName', { types });
        setValidateNameAndGas(initValidateNameAndGas);
        return;
      } else {
        clearErrors();
      }

      // 2. Async validate balance is afford gas fee and relayer fee and bucket name is available
      checkGasFee(value);
    },
    [checkGasFee, clearErrors, setError, setValue, validateNameRules],
  );

  const onSubmit = async (data: any) => {
    dispatch(
      setStatusDetail({ icon: PENDING_ICON_URL, title: 'Creating Bucket', desc: WALLET_CONFIRM }),
    );
    const { seedString } = await dispatch(
      getSpOffChainData(address, selectedSpRef.current.operatorAddress),
    );
    const bucketName = data.bucketName;
    const selectedPaAddress = selectedPaRef.current.address;
    const createBucketPayload: CreateBucketApprovalRequest = {
      bucketName,
      creator: address,
      paymentAddress: selectedPaAddress,
      visibility: ChainVisibilityEnum.VISIBILITY_TYPE_PUBLIC_READ,
      chargedReadQuota: String(chargeQuota * G_BYTES),
      spInfo: {
        primarySpAddress: selectedSpRef.current.operatorAddress,
      },
    };

    const [txRes, error] = await createBucket(
      createBucketPayload,
      {
        type: 'EDDSA',
        domain: window.location.origin,
        seed: seedString,
        address,
      },
      connector!,
    );

    if (error) return onError(error);
    if (txRes?.code !== 0) return onError((txRes as any).message || txRes?.rawLog);

    await pollingGetBucket({
      address: createBucketPayload.creator,
      endpoint: globalSP.endpoint,
      bucketName: createBucketPayload.bucketName,
    });

    dispatch(setStatusDetail({} as TStatusDetail));

    onClose();
    dispatch(setupBuckets(address));
    toast.success({
      description: `Bucket created successfully!`,
    });
    dispatch(setStatusDetail({} as TStatusDetail));
    reportEvent({
      name: 'dc.toast.bucket_create.success.show',
    });
  };

  const disableCreateButton = () => {
    return (
      isSubmitting ||
      (!isEmpty(validateNameAndGas) &&
        (validateNameAndGas.isValidating ||
          !validateNameAndGas.gas.available ||
          !validateNameAndGas.name.available)) ||
      isEmpty(bucketName) ||
      !isEmpty(errors?.bucketName) ||
      !isEnoughBalance ||
      isLoadingDetail === selectedPaRef.current.address ||
      !balanceEnough
    );
  };
  const isEnoughBalance = useMemo(() => {
    return !!(
      (!validateNameAndGas.gas.value && balance.comparedTo(MIN_AMOUNT) >= 0) ||
      (validateNameAndGas.gas.value && balance.comparedTo(validateNameAndGas.gas.value) >= 0)
    );
  }, [balance, validateNameAndGas.gas.value]);

  const onChangeSP = useCallback(
    (sp: SpItem) => {
      selectedSpRef.current = sp;
      const { value, available } = validateNameAndGas.name;
      if (available && value) {
        checkGasFee(value);
      }
    },
    [checkGasFee, validateNameAndGas.name],
  );

  const onChangePA = useCallback(
    async (pa: TAccount) => {
      selectedPaRef.current = pa;
      await dispatch(setupAccountDetail(pa.address));
      const { value, available } = validateNameAndGas.name;
      if (available && value) {
        checkGasFee(value);
      }
    },
    [checkGasFee, dispatch, validateNameAndGas.name],
  );

  return (
    <>
      <QDrawerHeader flexDirection="column">
        <Box mb={4}>Create a Bucket</Box>
        <Box fontSize={16} color={'readable.tertiary'} fontWeight={400}>
          Buckets are containers for data stored on BNB Greenfield. Bucket name must be globally
          unique.
        </Box>
      </QDrawerHeader>
      <QDrawerBody mt={0}>
        <Box>
          <form id="create-bucket-drawer" onSubmit={handleSubmit(onSubmit)}>
            <Flex flexDir="column" gap={16}>
              <FormControl isInvalid={!isEmpty(errors?.bucketName)}>
                <FormLabel fontWeight={500} fontSize={14} mb={8}>
                  Name
                </FormLabel>
                <InputGroup>
                  <Input
                    autoFocus
                    autoComplete="off"
                    type="text"
                    id="bucketName"
                    border="1px solid readable.border"
                    placeholder="Enter a bucket name"
                    fontSize="16px"
                    lineHeight={'19px'}
                    fontWeight={500}
                    height="52px"
                    // disabled={!isEnoughBalance}
                    {...register('bucketName')}
                    onChange={handleInputChange}
                  />
                  <InputRightElement marginRight={'8px'}>
                    <Tips
                      iconSize={'24px'}
                      containerWidth={'308px'}
                      trigger="hover"
                      tips={
                        <Box width={'308px'} paddingRight="8px">
                          <Text
                            color="readable.normal"
                            fontSize={'14px'}
                            fontWeight={600}
                            marginBottom="4px"
                          >
                            Naming Rules
                          </Text>
                          <Box
                            as="ul"
                            color={'readable.secondary'}
                            fontSize="14px"
                            lineHeight={'150%'}
                            listStyleType="disc"
                            listStylePosition={'outside'}
                            marginLeft="20px"
                            wordBreak={'break-word'}
                          >
                            <Box as="li" marginBottom={'4px'}>
                              Must be between 3 and 63 characters long.
                            </Box>
                            <Box as="li" marginBottom={'4px'}>
                              Consist only of lowercase letters, numbers, and hyphens (-).
                            </Box>
                            <Box as="li">Begin and end with a letter or number.</Box>
                          </Box>
                        </Box>
                      }
                    />
                  </InputRightElement>
                </InputGroup>
                {/* @ts-ignore */}
                {errors?.bucketName && Object.values(errors.bucketName.types).length > 0 && (
                  // @ts-ignore
                  <ErrorDisplay errorMsgs={Object.values(errors.bucketName.types)} />
                )}
              </FormControl>

              <FormControl>
                <FormLabel fontSize={14} fontWeight={500} mb={8}>
                  Primary Storage Provider
                </FormLabel>
                <SPSelector onChange={onChangeSP} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize={14} fontWeight={500} mb={8}>
                  Payment Account
                </FormLabel>
                <PaymentAccountSelector onChange={onChangePA} />
              </FormControl>
            </Flex>
            <Divider my={32} />
            <QuotaItem value={chargeQuota} onChange={setChargeQuota} />
          </form>
        </Box>
      </QDrawerBody>
      <QDrawerFooter w="100%" flexDirection={'column'}>
        <TotalFees
          gasFee={gasFee}
          prepaidFee={quotaFee}
          settlementFee={!chargeQuota ? '0' : settlementFee}
          payStoreFeeAddress={selectedPaRef.current.address}
        />

        <PaymentInsufficientBalance
          gasFee={gasFee}
          storeFee={quotaFee}
          refundFee="0"
          settlementFee={!chargeQuota ? '0' : settlementFee}
          payGasFeeBalance={bankBalance}
          payStoreFeeBalance={accountDetail.staticBalance}
          ownerAccount={address}
          payAccount={selectedPaRef.current.address}
          onValidate={setBalanceEnough}
        />

        <DCButton
          disabled={disableCreateButton()}
          size="lg"
          width={'100%'}
          gaClickName="dc.bucket.create_modal.createbtn.click"
          type="submit"
          form="create-bucket-drawer"
        >
          Create
        </DCButton>
      </QDrawerFooter>
    </>
  );
});
