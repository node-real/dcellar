import React, { ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';
import {
  Box,
  Flex,
  FormControl,
  FormLabel,
  Link,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Text,
  toast,
} from '@totejs/uikit';
import { InputItem } from '@/components/formitems/InputItem';
import { DCButton } from '@/components/common/DCButton';
import {
  BUTTON_GOT_IT,
  DUPLICATE_OBJECT_NAME,
  FOLDER_CREATE_FAILED,
  FOLDER_DESCRIPTION_CREATE_ERROR,
  GET_GAS_FEE_LACK_BALANCE_ERROR,
  LOCK_FEE_LACK_BALANCE_ERROR,
  UNKNOWN_ERROR,
  WALLET_CONFIRM,
} from '@/modules/object/constant';
import { DotLoading } from '@/components/common/DotLoading';
import { CreateObjectApprovalRequest, MsgCreateObjectTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { useAccount } from 'wagmi';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import {
  broadcastFault,
  createTxFault,
  E_OFF_CHAIN_AUTH,
  E_USER_REJECT_STATUS_NUM,
  simulateFault,
} from '@/facade/error';
import { useAppDispatch, useAppSelector } from '@/store';
import { getSpOffChainData } from '@/store/slices/persist';
import { useChecksumApi } from '@/modules/checksum';
import { resolve } from '@/facade/common';
import { setStatusDetail, TStatusDetail } from '@/store/slices/object';
import { selectStoreFeeParams, setupStoreFeeParams } from '@/store/slices/global';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { legacyGetObjectMeta } from '@/facade/object';
import { useAsyncEffect } from 'ahooks';
import { isEmpty } from 'lodash-es';
import { setupAccountDetail, TAccountDetail } from '@/store/slices/accounts';
import { getStoreNetflowRate } from '@/utils/payment';
import { TotalFees } from './TotalFees';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { AllBucketInfo } from '@/store/slices/bucket';
import { SpItem } from '@/store/slices/sp';
import { BN } from '@/utils/math';
import { signTypedDataCallback } from '@/facade/wallet';
import { removeTrailingSlash } from '@/utils/string';
import { genCreateObjectTx } from '@/modules/object/utils/genCreateObjectTx';
import { renderPaymentInsufficientBalance } from '@/modules/object/utils';
import { Animates } from '@/components/AnimatePng';

interface CreateFolderOperationProps {
  selectBucket: AllBucketInfo;
  bucketAccountDetail: TAccountDetail;
  primarySp: SpItem;
  refetch?: (name?: string) => void;
  onClose?: () => void;
}

export const CreateFolderOperation = memo<CreateFolderOperationProps>(function CreateFolderDrawer({
  refetch = () => {},
  onClose = () => {},
  selectBucket: bucket,
  bucketAccountDetail: accountDetail,
  primarySp,
}) {
  const dispatch = useAppDispatch();
  const { connector } = useAccount();

  const storeFeeParams = useAppSelector(selectStoreFeeParams);
  const checksumWorkerApi = useChecksumApi();
  const { bucketName, folders, objects, path } = useAppSelector((root) => root.object);
  const { gasObjects = {} } = useAppSelector((root) => root.global.gasHub);
  const { gasFee } = gasObjects?.[MsgCreateObjectTypeUrl] || {};
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { bankBalance } = useAppSelector((root) => root.accounts);
  const folderList = objects[path]?.filter((item) => item.objectName.endsWith('/')) || [];
  const { PaymentAddress } = bucket;
  const { settlementFee } = useSettlementFee(PaymentAddress);
  const { setOpenAuthModal } = useOffChainAuth();
  const isOwnerAccount = accountDetail.address === loginAccount;

  const onCloseStatusModal = () => {
    dispatch(setStatusDetail({} as TStatusDetail));
  };

  const [loading, setLoading] = useState(false);
  const [inputFolderName, setInputFolderName] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [usedNames, setUsedNames] = useState<string[]>([]);

  useAsyncEffect(async () => {
    if (isEmpty(storeFeeParams)) {
      dispatch(setupStoreFeeParams());
    }
  }, []);

  const storeFee = useMemo(() => {
    if (isEmpty(storeFeeParams)) return '-1';
    const netflowRate = getStoreNetflowRate(0, storeFeeParams);
    const storeFee = BN(netflowRate)
      .times(storeFeeParams.reserveTime)
      .dividedBy(10 ** 18);

    return storeFee.toString();
  }, [storeFeeParams]);

  const getPath = useCallback((name: string, folders: string[]) => {
    const parentFolderName = folders && folders[folders.length - 1];

    return parentFolderName && parentFolderName.length > 0
      ? `${folders.join('/')}/${name}/`
      : `${name}/`;
  }, []);

  const broadcastCreateTx = async (createTx: any) => {
    const [simulateInfo, error] = await createTx
      .simulate({ denom: 'BNB' })
      .then(resolve, simulateFault);
    return createTx
      .broadcast({
        denom: 'BNB',
        gasLimit: Number(simulateInfo?.gasLimit),
        gasPrice: simulateInfo?.gasPrice || '5000000000',
        payer: loginAccount,
        granter: '',
        signTypedDataCallback: signTypedDataCallback(connector!),
      })
      .then(resolve, broadcastFault);
  };

  const showSuccessToast = (tx: string) => {
    toast.success({
      description: (
        <>
          Folder created successfully! View in{' '}
          <Link
            color="#3C9AF1"
            _hover={{ color: '#3C9AF1', textDecoration: 'underline' }}
            href={`${removeTrailingSlash(GREENFIELD_CHAIN_EXPLORER_URL)}/tx/0x${tx}`}
            isExternal
          >
            GreenfieldScan
          </Link>
          .
        </>
      ),
      duration: 3000,
    });
  };

  const onCreateFolder = async () => {
    if (!validateFolderName(inputFolderName)) return;
    setLoading(true);

    // 1. create tx and validate folder by chain
    const [CreateObjectTx, error] = await fetchCreateFolderApproval(inputFolderName);
    if (typeof error === 'string') {
      setLoading(false);
      if (error === E_OFF_CHAIN_AUTH) {
        return setOpenAuthModal();
      }
      if (error?.includes('lack of') || error?.includes('static balance is not enough')) {
        setFormErrors([GET_GAS_FEE_LACK_BALANCE_ERROR]);
      } else if (error?.includes('Object already exists') || error?.includes('repeated object')) {
        setFormErrors([DUPLICATE_OBJECT_NAME]);
        setUsedNames((names) => [...names, inputFolderName]);
      } else {
        setFormErrors([UNKNOWN_ERROR]);
      }
      return;
    }
    dispatch(
      setStatusDetail({
        icon: Animates.object,
        title: 'Creating Folder',
        desc: WALLET_CONFIRM,
      }),
    );

    // 2. broadcast tx
    const [txRes, bcError] = await broadcastCreateTx(CreateObjectTx);
    if (bcError) {
      setLoading(false);
      if (bcError === E_USER_REJECT_STATUS_NUM) {
        // onStatusModalClose();
        return;
      }
      dispatch(
        setStatusDetail({
          icon: 'status-failed',
          title: FOLDER_CREATE_FAILED,
          desc: FOLDER_DESCRIPTION_CREATE_ERROR,
          buttonText: BUTTON_GOT_IT,
          errorText: bcError ? `Error Message: ${bcError}` : '',
        }),
      );
      return;
    }
    await dispatch(setupAccountDetail(PaymentAddress));
    if (txRes?.code !== 0) {
      dispatch(
        setStatusDetail({
          icon: 'status-failed',
          title: FOLDER_CREATE_FAILED,
          desc: FOLDER_DESCRIPTION_CREATE_ERROR,
          buttonText: BUTTON_GOT_IT,
          errorText: txRes?.rawLog ? `Error Message: ${txRes?.rawLog}` : '',
          buttonOnClick: onCloseStatusModal,
        }),
      );
      return;
    }
    const { transactionHash } = txRes;

    // polling ensure create sealed
    const fullPath = getPath(inputFolderName, folders);
    await legacyGetObjectMeta(bucketName, fullPath, primarySp.endpoint);

    setLoading(false);
    showSuccessToast(transactionHash);
    dispatch(setStatusDetail({} as TStatusDetail));
    onClose();
    refetch(inputFolderName);
  };
  const validateFolderName = (value: string) => {
    const errors = Array<string>();
    if (value === '') {
      errors.push('Please enter the folder name.');
      setFormErrors(errors);
      return false;
    }
    if (new Blob([value]).size > 70) {
      errors.push('Must be between 1 to 70 characters long.');
    }
    if (value.includes('/')) {
      errors.push('Cannot consist of slash(/).');
    }
    const folderNames = folderList.map((folder) => folder.name);
    if (folderNames.includes(value)) {
      errors.push('Folder name already exists.');
    }
    setFormErrors(errors);

    return !errors.length;
  };

  const fetchCreateFolderApproval = async (
    folderName: string,
    visibility: any = 'VISIBILITY_TYPE_INHERIT',
  ) => {
    const fullPath = getPath(folderName, folders);
    const file = new File([], fullPath, { type: 'text/plain' });
    const { seedString } = await dispatch(
      getSpOffChainData(loginAccount, primarySp.operatorAddress),
    );
    const hashResult = await checksumWorkerApi?.generateCheckSumV2(file);
    const createObjectPayload: CreateObjectApprovalRequest = {
      bucketName,
      objectName: fullPath,
      creator: loginAccount,
      visibility,
      fileType: file.type,
      contentLength: file.size,
      expectCheckSums: hashResult?.expectCheckSums || [],
    };
    const [createObjectTx, createError] = await genCreateObjectTx(createObjectPayload, {
      type: 'EDDSA',
      domain: window.location.origin,
      seed: seedString,
      address: loginAccount,
    }).then(resolve, createTxFault);

    if (createError) {
      return [null, createError];
    }

    const [simulateInfo, error] = await createObjectTx!
      .simulate({ denom: 'BNB' })
      .then(resolve, simulateFault);
    if (!simulateInfo) return [simulateInfo, error];

    return [createObjectTx, error];
  };

  const lackGasFee = formErrors.includes(GET_GAS_FEE_LACK_BALANCE_ERROR);
  const onFolderNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const folderName = e.target.value;
    setInputFolderName(folderName);
    if (usedNames.includes(folderName)) {
      setFormErrors([DUPLICATE_OBJECT_NAME]);
      return;
    }
    if (!lackGasFee) validateFolderName(folderName);
  };

  useEffect(() => {
    if (isEmpty(storeFeeParams)) {
      return;
    }
    const nGasFee = BigNumber(gasFee);
    if (isOwnerAccount) {
      if (BigNumber(storeFee).gt(BigNumber(accountDetail.staticBalance).plus(bankBalance))) {
        setTimeout(() => setFormErrors([GET_GAS_FEE_LACK_BALANCE_ERROR]), 100);
      }
    } else {
      if (
        BigNumber(storeFee).gt(BigNumber(accountDetail.staticBalance)) ||
        nGasFee.gt(BigNumber(bankBalance))
      ) {
        setTimeout(() => setFormErrors([LOCK_FEE_LACK_BALANCE_ERROR]), 100);
      }
    }
  }, [
    gasFee,
    bankBalance,
    storeFee,
    accountDetail.staticBalance,
    loginAccount,
    isOwnerAccount,
    storeFeeParams,
  ]);

  return (
    <>
      <QDrawerHeader flexDirection={'column'}>
        <Box>Create a Folder</Box>
        <Text className="ui-drawer-sub">
          Use folders to group objects in your bucket. Folder names can't contain "/".
        </Text>
      </QDrawerHeader>
      <QDrawerBody>
        <Flex flexDirection="column" alignItems="center">
          <FormControl isInvalid={!!formErrors.length} w="100%">
            <FormLabel>
              <Text fontSize={14} fontWeight={500} mb={8}>
                Name
              </Text>
              <InputItem
                value={inputFolderName}
                onChange={onFolderNameChange}
                tips={{
                  title: 'Naming Rules',
                  rules: [
                    'Must be between 1 and 70 characters long.',
                    'Cannot consist of slash(/).',
                  ],
                }}
              />
            </FormLabel>

            {formErrors && formErrors.length > 0 && <ErrorDisplay errorMsgs={formErrors} />}
          </FormControl>
        </Flex>
      </QDrawerBody>
      <QDrawerFooter w="100%" flexDirection={'column'}>
        <TotalFees
          payStoreFeeAddress={PaymentAddress}
          gasFee={gasFee}
          prepaidFee={storeFee}
          settlementFee={settlementFee}
        />
        {renderPaymentInsufficientBalance({
          gasFee,
          storeFee,
          refundFee: '0',
          settlementFee,
          payGasFeeBalance: bankBalance,
          payStoreFeeBalance: accountDetail.staticBalance,
          ownerAccount: loginAccount,
          payAccount: accountDetail.address,
        })}
        <Flex w="100%">
          <DCButton
            size="lg"
            w="100%"
            onClick={onCreateFolder}
            isDisabled={loading || !!formErrors.length}
            justifyContent="center"
            gaClickName="dc.file.create_folder_m.create.click"
          >
            {loading ? (
              <>
                Loading
                <DotLoading />
              </>
            ) : (
              'Create'
            )}
          </DCButton>
        </Flex>
      </QDrawerFooter>
    </>
  );
});