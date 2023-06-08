import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Text,
  toast,
} from '@totejs/uikit';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAccount } from 'wagmi';
import { debounce, isEmpty } from 'lodash-es';
import BigNumber from 'bignumber.js';
import NextLink from 'next/link';

import { IRawSPInfo, TCreateBucketFromValues } from '../../type';
import { GasFee } from './GasFee';
import { useLogin } from '@/hooks/useLogin';
import { genCreateBucketTx, pollingGetBucket } from '@/modules/buckets/List/utils';
import { CreateBucketFailed } from '@/modules/buckets/List/components/CreateBucketFailed';
import { CreatingBucket } from './CreatingBucket';
import { parseError } from '../../utils/parseError';
import { Tips } from '@/components/common/Tips';
import { ErrorDisplay } from './ErrorDisplay';
import { InternalRoutePaths } from '@/constants/links';
import { MIN_AMOUNT } from '@/modules/wallet/constants';
import { DCModal } from '@/components/common/DCModal';
import { DCButton } from '@/components/common/DCButton';
import { useDefaultChainBalance } from '@/context/GlobalContext/WalletBalanceContext';
import { SPSelector } from '@/modules/buckets/List/components/SPSelector';
import { GAClick, GAShow } from '@/components/common/GATracker';
import { reportEvent } from '@/utils/reportEvent';
import { useSPs } from '@/hooks/useSPs';
import { checkSpOffChainDataAvailable, getSpOffChainData } from '@/modules/off-chain-auth/utils';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { getDomain } from '@/utils/getDomain';
import { TCreateBucket } from '@bnb-chain/greenfield-chain-sdk';
import { signTypedDataV4 } from '@/utils/signDataV4';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  refetch: any;
};
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

export const CreateBucket = ({ isOpen, onClose, refetch }: Props) => {
  const {
    loginState: { address },
  } = useLogin();

  const { sp: globalSP, sps: globalSps } = useSPs();
  // const [sp, setSP] = useState<IRawSPInfo>(globalSP);
  const selectedSpRef = useRef<IRawSPInfo>(globalSP);
  const { connector } = useAccount();
  const { availableBalance } = useDefaultChainBalance();
  const balance = BigNumber(availableBalance || 0);
  const [submitErrorMsg, setSubmitErrorMsg] = useState('');
  const nonceRef = useRef(0);
  const [validateNameAndGas, setValidateNameAndGas] =
    useState<ValidateNameAndGas>(initValidateNameAndGas);

  // pending, operating, failed
  const [status, setStatus] = useState('pending');
  const { setOpenAuthModal } = useOffChainAuth();
  const {
    handleSubmit,
    register,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<TCreateBucketFromValues>({
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
      // if (/\.{2,}/.test(value)) {
      //   types['validateDot'] = 'Must not contain two adjacent periods.';
      // }
      // if (value !== '' && (value.indexOf('.-') !== -1 || value.indexOf('-.') !== -1)) {
      //   types['validateDot'] = 'Must not contain dash next to period.';
      // }
      // if (
      //   /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(
      //     value,
      //   )
      // ) {
      //   types['validateIp'] = 'Must not be formatted as an IP address.';
      // }
      return types;
    },
    [balance],
  );
  const debounceValidate = debounce(async (value, curNonce) => {
    if (curNonce !== nonceRef.current) return;
    const types: { [key: string]: string } = {};
    const bucketName = value;
    try {
      setValidateNameAndGas({ ...validateNameAndGas, isValidating: true });
      const domain = getDomain();
      const sp = selectedSpRef.current;
      const spOffChainData = await getSpOffChainData({ address, spAddress: sp.operatorAddress });
      const { seedString } = spOffChainData;
      if (!checkSpOffChainDataAvailable(spOffChainData)) {
        onClose();
        setOpenAuthModal([sp.operatorAddress]);
        return;
      }
      const secondarySpAddresses = globalSps
        .filter((item: any) => item.operatorAddress !== sp.operatorAddress)
        .map((item: any) => item.operatorAddress);
      const createBucketParams: TCreateBucket = {
        creator: address,
        bucketName,
        spInfo: {
          endpoint: sp.endpoint,
          primarySpAddress: sp.operatorAddress,
          sealAddress: sp.sealAddress,
          secondarySpAddresses,
        },
        signType: 'offChainAuth',
        domain,
        seedString,
        // TODO check up update visibility component
        visibility: 'VISIBILITY_TYPE_PUBLIC_READ',
        chargedReadQuota: '0',
      };
      const createBucketTx = await genCreateBucketTx(createBucketParams);

      const simulateInfo = await createBucketTx.simulate({
        denom: 'BNB',
      });
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
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.log('get fee error', e);
      // Because loading has no order, so we keeping loading until get the right response
      if (curNonce !== nonceRef.current) {
        return;
      }
      const result: any = {
        ...validateNameAndGas,
        isLoading: false,
      };
      if (e?.message) {
        if (e.message.includes('Bucket already exists')) {
          result['name'] = {
            available: false,
            value: value,
          };
          types['validateName'] = 'This name is already taken, try another one.';
        } else if (e.message.toLowerCase().includes('balance')) {
          result['gas'] = {
            available: false,
            value: BigNumber(0),
          };
          types['validateBalance'] = '';
        } else if (e.statusCode === 500) {
          onClose();
          types['validateOffChainAuth'] = '';
          setOpenAuthModal([selectedSpRef.current.operatorAddress]);
        } else {
          const { isError, message } = parseError(e.message);
          types['validateBalanceAndName'] =
            !isError && message !== 'rpc error'
              ? message || e.message
              : 'Unknown error, please try again later.';
        }
      } else {
        types['validateBalanceAndName'] = 'Something is wrong.';
      }

      Object.values(types).length > 0 ? setError('bucketName', { types }) : clearErrors();
      setValidateNameAndGas(result);
    }
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

  const onSubmit = useCallback(
    async (data: any) => {
      try {
        setStatus('operating');
        const spOffChainData = await getSpOffChainData({address, spAddress: selectedSpRef.current.operatorAddress});
        if (!checkSpOffChainDataAvailable(spOffChainData)) {
          onClose();
          setOpenAuthModal([selectedSpRef.current.operatorAddress]);
          return;
        }
        const { seedString } = spOffChainData;
        const bucketName = data.bucketName;
        const domain = getDomain();
        // NOTICE: Avoid the user skip got get gas fee step
        const secondarySpAddresses = globalSps
          .filter((item: any) => item.operatorAddress !== selectedSpRef.current.operatorAddress)
          .map((item: any) => item.operatorAddress);
        const spInfo = {
          endpoint: selectedSpRef.current.endpoint,
          primarySpAddress:selectedSpRef.current.operatorAddress,
          sealAddress: selectedSpRef.current.sealAddress,
          secondarySpAddresses,
        };
        const createBucketParams: TCreateBucket = {
          creator: address,
          bucketName,
          spInfo,
          signType: 'offChainAuth',
          domain,
          seedString,
          visibility: 'VISIBILITY_TYPE_PUBLIC_READ',
          chargedReadQuota: '0',
        };
        const createBucketTx = await genCreateBucketTx(createBucketParams);
        const simulateInfo = await createBucketTx.simulate({
          denom: 'BNB',
        });
        const txRes = await createBucketTx.broadcast({
          denom: 'BNB',
          gasLimit: Number(simulateInfo?.gasLimit),
          gasPrice: simulateInfo?.gasPrice || '5000000000',
          payer: createBucketParams.creator,
          granter: '',
          signTypedDataCallback: async (addr: string, message: string) => {
            const provider = await connector?.getProvider();
            return await signTypedDataV4(provider, addr, message);
          },
        });

        await pollingGetBucket({
          address: createBucketParams.creator,
          endpoint: createBucketParams.spInfo.endpoint,
          // @ts-ignore This is a temp solution for check bucket has been recorded in metaservice
          bucketName: createBucketParams.bucketName,
        });

        if (txRes.code === 0) {
          onClose();
          typeof refetch === 'function' && refetch();
          toast.success({
            description: `Bucket created successfully!`,
          });
          setTimeout(() => {
            setStatus('pending');
          }, 200);
          reportEvent({
            name: 'dc.toast.bucket_create.success.show',
          });
        } else {
          throw txRes;
        }
      } catch (e: any) {
        setStatus('failed');
        // handle chain and storage error
        const errorMsg = e?.message;
        errorMsg && setSubmitErrorMsg(errorMsg);
        // eslint-disable-next-line no-console
        console.log('submit error', e);
      }
    },
    [address, connector, globalSps, onClose, refetch, setOpenAuthModal],
  );

  const disableCreateButton = () => {
    return (
      isSubmitting ||
      (!isEmpty(validateNameAndGas) &&
        (validateNameAndGas.isValidating ||
          !validateNameAndGas.gas.available ||
          !validateNameAndGas.name.available)) ||
      isEmpty(bucketName) ||
      !isEmpty(errors?.bucketName) ||
      !isEnoughBalance
    );
  };
  const isEnoughBalance = useMemo(() => {
    if (
      balance.comparedTo(MIN_AMOUNT) > 0 ||
      (validateNameAndGas.gas.value && balance.comparedTo(validateNameAndGas.gas.value) >= 0)
    ) {
      return true;
    }

    return false;
  }, [balance, validateNameAndGas.gas.value]);

  const onChangeSP = useCallback(
    (sp: IRawSPInfo) => {
      selectedSpRef.current = sp;

      const { value, available } = validateNameAndGas.name;
      if (available && value) {
        checkGasFee(value);
      }
    },
    [checkGasFee, validateNameAndGas.name],
  );

  const gaOptions = getGAOptions(status);

  return (
    <DCModal
      isOpen={isOpen}
      onClose={onClose}
      gaShowName={gaOptions.showName}
      gaClickCloseName={gaOptions.closeName}
    >
      <ModalCloseButton />
      <Box>
        {status === 'pending' && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader fontFamily="heading">Create a Bucket</ModalHeader>
            <ModalBody mt={0}>
              <Box
                textAlign="center"
                fontSize={18}
                fontWeight={400}
                lineHeight="22px"
                color="readable.tertiary"
                my={32}
              >
                Buckets are containers for data stored on BNB Greenfield. Bucket name must be
                globally unique.
              </Box>
              <Flex flexDir="column" gap={12}>
                <FormControl isInvalid={!isEmpty(errors?.bucketName)}>
                  <FormLabel fontWeight={500} fontSize={14} mb={8} fontFamily="heading">
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
                  <FormLabel fontSize={14} fontWeight={500} mb={8} fontFamily="heading">
                    Primary Storage Provider
                  </FormLabel>
                  <SPSelector onChange={onChangeSP} />
                </FormControl>
              </Flex>
              <GasFee
                gasFee={validateNameAndGas.gas.value}
                hasError={!isEmpty(errors.bucketName)}
                isGasLoading={validateNameAndGas.isValidating}
              />
              {!isEnoughBalance && !validateNameAndGas.isValidating && (
                <Flex marginTop={'4px'} color={'#ee3911'} textAlign={'right'}>
                  <Text>Insufficient balance. &nbsp; </Text>
                  <GAShow name="dc.bucket.create_modal.transferin.show" />
                  <GAClick name="dc.bucket.create_modal.transferin.click">
                    <Link
                      as={NextLink}
                      textAlign={'right'}
                      cursor={'pointer'}
                      color="#ee3911"
                      _hover={{ color: '#ee3911' }}
                      textDecoration={'underline'}
                      href={InternalRoutePaths.transfer_in}
                    >
                      Transfer In
                    </Link>
                  </GAClick>
                </Flex>
              )}
            </ModalBody>
            <ModalFooter>
              <DCButton
                variant="dcPrimary"
                disabled={disableCreateButton()}
                backgroundColor={'readable.brand6'}
                height={'48px'}
                width={'100%'}
                gaClickName="dc.bucket.create_modal.createbtn.click"
              >
                Create
              </DCButton>
            </ModalFooter>
          </form>
        )}
        {status === 'operating' && <CreatingBucket />}
        {status === 'failed' && <CreateBucketFailed onClose={onClose} errorMsg={submitErrorMsg} />}
      </Box>
    </DCModal>
  );
};

function getGAOptions(status: string) {
  const options: Record<string, { showName: string; closeName: string }> = {
    pending: {
      showName: 'dc.bucket.create_modal.0.show',
      closeName: 'dc.bucket.create_modal.close.click',
    },
    operating: {
      showName: 'dc.bucket.creating_modal.0.show',
      closeName: 'dc.bucket.creating_modal.close.click',
    },
    failed: {
      showName: 'dc.bucket.create_fail_modal.0.show',
      closeName: 'dc.bucket.create_fail_modal.close.click',
    },
  };

  return options[status] ?? {};
}
