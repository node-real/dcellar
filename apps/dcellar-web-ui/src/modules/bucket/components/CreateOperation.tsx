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
import React, { memo, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAccount } from 'wagmi';
import { isEmpty } from 'lodash-es';
import BigNumber from 'bignumber.js';

import { genCreateBucketTx, pollingGetBucket } from '@/modules/buckets/List/utils';
import { Tips } from '@/components/common/Tips';
import { MIN_AMOUNT } from '@/modules/wallet/constants';
import { DCButton } from '@/components/common/DCButton';
import { SPSelector } from '@/modules/buckets/List/components/SPSelector';
import { reportEvent } from '@/utils/reportEvent';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { CreateBucketApprovalRequest, MsgCreateBucketTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { signTypedDataV4 } from '@/utils/signDataV4';
import { ChainVisibilityEnum } from '@/modules/file/type';
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
import { BN } from '@/utils/BigNumber';
import { TotalFees } from '@/modules/object/components/TotalFees';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { PaymentInsufficientBalance } from '@/modules/file/utils';
import { selectBucketList, setupBuckets } from '@/store/slices/bucket';

type ValidateName = {
  isValidating: boolean;
  name: {
    available: boolean;
    value: string | null;
  };
};

const initValidateName = {
  isValidating: false,
  name: {
    available: true,
    value: null,
  },
};

interface CreateOperationProps {
  onClose?: () => void;
}

export const CreateOperation = memo<CreateOperationProps>(function CreateOperation({
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
  const [submitErrorMsg, setSubmitErrorMsg] = useState('');
  const [chargeQuota, setChargeQuota] = useState(0);
  const { gasObjects = {} } = useAppSelector((root) => root.global.gasHub);
  const { gasFee } = gasObjects?.[MsgCreateBucketTypeUrl] || {};
  const storeFeeParams = useAppSelector(selectStoreFeeParams);
  const [validateName, setValidateName] = useState<ValidateName>(initValidateName);
  // pending, operating, failed
  // const [status, setStatus] = useState('pending');
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

  const handleInputChange = (event: any) => {
    const value = event.target.value;
    setValue('bucketName', value);

    // 1. validate name rules
    const types = validateNameRules(value);
    if (Object.values(types).length > 0) {
      setError('bucketName', { types });
      setValidateName(initValidateName);
      return;
    } else {
      clearErrors();
    }
  };

  const onSubmit = async (data: any) => {
    try {
      // setStatus('operating');
      const { seedString } = await dispatch(
        getSpOffChainData(address, selectedSpRef.current.operatorAddress),
      );
      if (!seedString) {
        setOpenAuthModal();
        return;
      }

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

      const createBucketTx = await genCreateBucketTx(createBucketPayload, {
        type: 'EDDSA',
        domain: window.location.origin,
        seed: seedString,
        address,
      });
      const simulateInfo = await createBucketTx.simulate({
        denom: 'BNB',
      });
      const txRes = await createBucketTx.broadcast({
        denom: 'BNB',
        gasLimit: Number(simulateInfo?.gasLimit),
        gasPrice: simulateInfo?.gasPrice || '5000000000',
        payer: createBucketPayload.creator,
        granter: '',
        signTypedDataCallback: async (addr: string, message: string) => {
          const provider = await connector?.getProvider();
          return await signTypedDataV4(provider, addr, message);
        },
      });
      // todo refactor
      await pollingGetBucket({
        address: createBucketPayload.creator,
        endpoint: globalSP.endpoint,
        bucketName: createBucketPayload.bucketName,
      });

      if (txRes.code === 0) {
        onClose();
        dispatch(setupBuckets(address));
        toast.success({
          description: `Bucket created successfully!`,
        });
        // setTimeout(() => {
        //   setStatus('pending');
        // }, 200);
        reportEvent({
          name: 'dc.toast.bucket_create.success.show',
        });
      } else {
        throw txRes;
      }
    } catch (e: any) {
      // setStatus('failed');
      // handle chain and storage error
      const errorMsg = e?.message;
      errorMsg && setSubmitErrorMsg(errorMsg);
      // eslint-disable-next-line no-console
      console.log('submit error', e);
    }
  };

  const disableCreateButton = () => {
    return (
      isSubmitting ||
      (!isEmpty(validateName) && (validateName.isValidating || !validateName.name.available)) ||
      isEmpty(bucketName) ||
      !isEmpty(errors?.bucketName) ||
      isLoadingDetail === selectedPaRef.current.address ||
      !balanceEnough
    );
  };

  const onChangeSP = (sp: SpItem) => {
    selectedSpRef.current = sp;
  };

  const onChangePA = (pa: TAccount) => {
    selectedPaRef.current = pa;
    dispatch(setupAccountDetail(pa.address));
  };

  /**
   *
   * {status === 'operating' && <CreatingBucket onClose={() => setStatus('pending')} />}
   *       {status === 'failed' && (
   *         <CreateBucketFailed errorMsg={submitErrorMsg} onClose={() => setStatus('pending')} />
   *       )}
   */

  return (
    <>
      <QDrawerHeader>Create a Bucket</QDrawerHeader>
      <QDrawerBody mt={0}>
        <Box>
          <form id="create-bucket-drawer" onSubmit={handleSubmit(onSubmit)}>
            <Box
              textAlign="left"
              fontSize={18}
              fontWeight={400}
              lineHeight="22px"
              color="readable.tertiary"
              my={32}
            >
              Buckets are containers for data stored on BNB Greenfield. Bucket name must be globally
              unique.
            </Box>
            <Flex flexDir="column" gap={12}>
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
                    border="1px solid #EAECF0"
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
                            {/* <Box as="li">Must not contain two adjacent periods.</Box>
                            <Box as="li">Must not contain dash next to period.</Box>
                            <Box as="li">Must not be formatted as an IP address.</Box> */}
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
          backgroundColor={'readable.brand6'}
          height={'48px'}
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
