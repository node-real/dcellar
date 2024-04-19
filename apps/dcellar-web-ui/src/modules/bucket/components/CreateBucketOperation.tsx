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
} from '@node-real/uikit';
import BigNumber from 'bignumber.js';
import { debounce, isEmpty } from 'lodash-es';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAccount } from 'wagmi';

import { Animates } from '@/components/AnimatePng';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { DCButton } from '@/components/common/DCButton';
import { DEFAULT_TAG, EditTags, getValidTags } from '@/components/common/ManageTags';
import { Tips } from '@/components/common/Tips';
import { MonthlyDownloadQuota } from '@/components/formitems/MonthlyDownloadQuota';
import { G_BYTES } from '@/constants/legacy';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import {
  getCreateBucketTx,
  getUpdateBucketTagsTx,
  pollingGetBucket,
  simulateCreateBucket,
} from '@/facade/bucket';
import { broadcastMulTxs } from '@/facade/common';
import { E_GET_GAS_FEE_LACK_BALANCE_ERROR, E_OFF_CHAIN_AUTH } from '@/facade/error';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { PaymentAccountSelector } from '@/modules/bucket/components/PaymentAccountSelector';
import { TotalFees } from '@/modules/object/components/TotalFees';
import { BUTTON_GOT_IT, WALLET_CONFIRM } from '@/modules/object/constant';
import { PaymentInsufficientBalance } from '@/modules/object/utils';
import { MIN_AMOUNT } from '@/modules/wallet/constants';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectAccount, setupAccountRecords, AccountEntity } from '@/store/slices/accounts';
import {
  selectBucketList,
  setBucketOperation,
  setBucketTagsEditData,
  setupBucketList,
} from '@/store/slices/bucket';
import {
  selectGnfdGasFeesConfig,
  selectStoreFeeParams,
  setSignatureAction,
  setupStoreFeeParams,
} from '@/store/slices/global';
import { SpEntity } from '@/store/slices/sp';
import { reportEvent } from '@/utils/gtag';
import { BN } from '@/utils/math';
import { getQuotaNetflowRate } from '@/utils/payment';
import {
  MsgCreateBucketTypeUrl,
  MsgSetTagTypeUrl,
  TxResponse,
  VisibilityType,
  Long,
} from '@bnb-chain/greenfield-js-sdk';
import { useAsyncEffect, useUnmount } from 'ahooks';
import { SPSelector } from './SPSelector';
import { MsgCreateBucket } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/tx';

type ValidateNameAndGas = {
  isValidating: boolean;
  gas: { available: boolean; value: BigNumber | null };
  name: { available: boolean; value: string | null };
};

const initValidateNameAndGas = {
  isValidating: false,
  gas: { available: true, value: null },
  name: { available: true, value: null },
};

interface CreateBucketOperationProps {
  onClose?: () => void;
}

export const CreateBucketOperation = memo<CreateBucketOperationProps>(function CreateOperation({
  onClose = () => {},
}) {
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const accountInfoLoading = useAppSelector((root) => root.accounts.accountInfoLoading);
  const spRecords = useAppSelector((root) => root.sp.spRecords);
  const specifiedSp = useAppSelector((root) => root.sp.specifiedSp);
  const bucketEditTagsData = useAppSelector((root) => root.bucket.bucketEditTagsData);
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);
  const gnfdGasFeesConfig = useAppSelector(selectGnfdGasFeesConfig) || {};
  const storeFeeParams = useAppSelector(selectStoreFeeParams);
  const bucketList = useAppSelector(selectBucketList(loginAccount));

  const [chargeQuota, setChargeQuota] = useState(0);
  const globalSP = spRecords[specifiedSp];
  const selectedSpRef = useRef<SpEntity>(globalSP);
  const selectedPaRef = useRef<AccountEntity>({} as AccountEntity);
  const nonceRef = useRef(0);
  const [validateNameAndGas, setValidateNameAndGas] =
    useState<ValidateNameAndGas>(initValidateNameAndGas);
  const [balanceEnough, setBalanceEnough] = useState(true);

  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();
  const PaymentAddress = selectedPaRef.current.address;
  const { settlementFee } = useSettlementFee(PaymentAddress);
  const accountDetail = useAppSelector(selectAccount(PaymentAddress));

  const validTags = getValidTags(bucketEditTagsData);
  const balance = useMemo(() => BigNumber(bankBalance || 0), [bankBalance]);
  const { gasFee: createBucketGasFee } = gnfdGasFeesConfig?.[MsgCreateBucketTypeUrl] || {};
  const { gasFee: setTagsGasFee } = gnfdGasFeesConfig?.[MsgSetTagTypeUrl] || {};

  const gasFee = useMemo(() => {
    if (validTags.length === 0) {
      return createBucketGasFee || 0;
    }

    return BN(createBucketGasFee || 0)
      .plus(BN(setTagsGasFee || 0))
      .toNumber();
  }, [validTags.length, createBucketGasFee, setTagsGasFee]);

  const quotaFee = useMemo(() => {
    if (isEmpty(storeFeeParams)) return '-1';
    const netflowRate = getQuotaNetflowRate(chargeQuota * G_BYTES, storeFeeParams);
    return BN(netflowRate).times(storeFeeParams.reserveTime).toString();
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

  const validateNameRules = useCallback(
    (value: string) => {
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
    },
    [balance, bucketList],
  );

  const errorHandler = (type: string) => {
    if (type === E_OFF_CHAIN_AUTH) {
      return setOpenAuthModal();
    }

    dispatch(
      setSignatureAction({
        icon: 'status-failed',
        title: 'Create Failed',
        desc: 'Sorry, there’s something wrong when creating the bucket.',
        buttonText: BUTTON_GOT_IT,
        errorText: 'Error message: ' + type,
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
    const bucketName = value;
    setValidateNameAndGas({ ...validateNameAndGas, isValidating: true });
    const sp = selectedSpRef.current;
    const msgCreateBucket: MsgCreateBucket = {
      creator: loginAccount,
      bucketName,
      visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
      paymentAddress: loginAccount,
      primarySpAddress: sp.operatorAddress,

      chargedReadQuota: Long.fromNumber(chargeQuota * G_BYTES),
    };
    const [simulateInfo, error] = await simulateCreateBucket(msgCreateBucket);

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

  const validateName = useCallback(
    (value: string) => {
      // 1. validate name rules
      const types = validateNameRules(value);
      if (Object.values(types).length > 0) {
        setError('bucketName', { types });
        setValidateNameAndGas(initValidateNameAndGas);
        return false;
      } else {
        clearErrors();
      }
      return true;
    },
    [validateNameRules, setError, setValidateNameAndGas, clearErrors],
  );

  const onInputChange = useCallback(
    (event: any) => {
      const value = event.target.value;
      setValue('bucketName', value);

      const valid = validateName(value);
      if (!valid) return;

      // 2. Async validate balance is afford gas fee and relayer fee and bucket name is available
      checkGasFee(value);
    },
    [checkGasFee, setValue, validateName],
  );

  const onSubmit = async (data: any) => {
    dispatch(
      setSignatureAction({ icon: Animates.object, title: 'Creating Bucket', desc: WALLET_CONFIRM }),
    );
    const bucketName = data.bucketName;
    const selectedPaAddress = selectedPaRef.current.address;
    const msgCreateBucket: MsgCreateBucket = {
      creator: loginAccount,
      bucketName,
      paymentAddress: selectedPaAddress,
      visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
      chargedReadQuota: Long.fromNumber(chargeQuota * G_BYTES),
      primarySpAddress: selectedSpRef.current.operatorAddress,
    };

    const txs: TxResponse[] = [];
    const [bucketTx, error1] = await getCreateBucketTx(msgCreateBucket);
    if (!bucketTx) return errorHandler(error1);

    txs.push(bucketTx);

    if (validTags.length > 0) {
      const [tagsTx, error2] = await getUpdateBucketTagsTx({
        address: loginAccount,
        bucketName: bucketName,
        tags: validTags,
      });
      if (!tagsTx) return errorHandler(error2);
      txs.push(tagsTx);
    }

    const [txRes, error] = await broadcastMulTxs({
      txs,
      address: loginAccount,
      connector: connector!,
    });
    if (error) return errorHandler(error);
    if (txRes?.code !== 0) return errorHandler((txRes as any).message || txRes?.rawLog);

    await pollingGetBucket({
      address: msgCreateBucket.creator,
      endpoint: globalSP.endpoint,
      bucketName: msgCreateBucket.bucketName,
    });

    dispatch(setSignatureAction({}));

    onClose();
    dispatch(setupBucketList(loginAccount));
    toast.success({
      description: `Bucket created successfully!`,
    });
    dispatch(setSignatureAction({}));
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
      accountInfoLoading === selectedPaRef.current.address ||
      !balanceEnough
    );
  };

  const isEnoughBalance = useMemo(() => {
    return !!(
      (!validateNameAndGas.gas.value && balance.comparedTo(MIN_AMOUNT) >= 0) ||
      (validateNameAndGas.gas.value && balance.comparedTo(validateNameAndGas.gas.value) >= 0)
    );
  }, [balance, validateNameAndGas.gas.value]);

  const onSpChange = useCallback((sp: SpEntity) => {
    selectedSpRef.current = sp;
  }, []);

  const onPaymentAccountChange = useCallback(
    async (pa: AccountEntity) => {
      selectedPaRef.current = pa;
      await dispatch(setupAccountRecords(pa.address));
      const { value, available } = validateNameAndGas.name;
      if (available && value) {
        checkGasFee(value);
      }
    },
    [dispatch, validateNameAndGas.name, checkGasFee],
  );

  const onEditTags = () => {
    dispatch(setBucketOperation({ level: 1, operation: ['', 'edit_tags'] }));
  };

  useAsyncEffect(async () => {
    if (!isEmpty(storeFeeParams)) return;
    dispatch(setupStoreFeeParams());
  }, [dispatch]);

  useUnmount(() => dispatch(setBucketTagsEditData([DEFAULT_TAG])));

  return (
    <>
      <QDrawerHeader flexDirection="column">
        <Box>Create a Bucket</Box>
        <Box className="ui-drawer-sub">
          Buckets are containers for data stored on BNB Greenfield. Bucket name must be globally
          unique.
        </Box>
      </QDrawerHeader>
      <QDrawerBody>
        <Box position="relative">
          <form id="create-bucket-drawer" onSubmit={handleSubmit(onSubmit)}>
            <Flex flexDir="column" gap={24}>
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
                    onChange={onInputChange}
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
                {/* @ts-check-error Ignore */}
                {errors?.bucketName && Object.values(errors.bucketName?.types || {}).length > 0 && (
                  <ErrorDisplay errorMsgs={Object.values(errors.bucketName?.types || {})} />
                )}
              </FormControl>

              <FormControl>
                <FormLabel fontSize={14} fontWeight={500} mb={8}>
                  Primary Storage Provider
                </FormLabel>
                <SPSelector onChange={onSpChange} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize={14} fontWeight={500} mb={8}>
                  Payment Account
                </FormLabel>
                <PaymentAccountSelector onChange={onPaymentAccountChange} />
              </FormControl>
              <FormControl>
                <FormLabel mb={8} fontWeight={500}>
                  Tags
                </FormLabel>
                <EditTags onClick={onEditTags} tagsData={validTags} />
              </FormControl>
            </Flex>

            <Divider my={32} />
            <MonthlyDownloadQuota value={chargeQuota} onChange={setChargeQuota} />
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
          ownerAccount={loginAccount}
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
