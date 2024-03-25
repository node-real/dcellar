import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { Animates } from '@/components/AnimatePng';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { DCButton } from '@/components/common/DCButton';
import { DotLoading } from '@/components/common/DotLoading';
import { DEFAULT_TAG, EditTags, getValidTags } from '@/components/common/ManageTags';
import { InputItem } from '@/components/formitems/InputItem';
import { useOffChainAuth } from '@/context/off-chain-auth/useOffChainAuth';
import { broadcastMulTxs, resolve } from '@/facade/common';
import {
  E_OFF_CHAIN_AUTH,
  E_USER_REJECT_STATUS_NUM,
  ErrorResponse,
  createTxFault,
  simulateFault,
} from '@/facade/error';
import { getUpdateObjectTagsTx, legacyGetObjectMeta } from '@/facade/object';
import { useSettlementFee } from '@/hooks/useSettlementFee';
import { useChecksumApi } from '@/modules/checksum';
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
import { PaymentInsufficientBalance } from '@/modules/object/utils';
import { genCreateObjectTx } from '@/modules/object/utils/genCreateObjectTx';
import { useAppDispatch, useAppSelector } from '@/store';
import { AccountInfo, setupAccountRecords } from '@/store/slices/accounts';
import { TBucket } from '@/store/slices/bucket';
import {
  selectGnfdGasFeesConfig,
  selectStoreFeeParams,
  setSignatureAction,
  setupStoreFeeParams,
} from '@/store/slices/global';
import { setObjectEditTagsData, setObjectOperation } from '@/store/slices/object';
import { getSpOffChainData } from '@/store/slices/persist';
import { SpEntity } from '@/store/slices/sp';
import { BN } from '@/utils/math';
import { getStoreNetflowRate } from '@/utils/payment';
import { removeTrailingSlash } from '@/utils/string';
import {
  CreateObjectApprovalRequest,
  MsgCreateObjectTypeUrl,
  MsgSetTagTypeUrl,
  TxResponse,
} from '@bnb-chain/greenfield-js-sdk';
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
} from '@node-real/uikit';
import { useAsyncEffect, useUnmount } from 'ahooks';
import BigNumber from 'bignumber.js';
import { isEmpty, last, trimEnd } from 'lodash-es';
import { ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { TotalFees } from './TotalFees';

interface CreateFolderOperationProps {
  selectBucket: TBucket;
  bucketAccountDetail: AccountInfo;
  primarySp: SpEntity;
  chainFolder?: string;
  refetch?: (name?: string) => void;
  onClose?: () => void;
}

export const CreateFolderOperation = memo<CreateFolderOperationProps>(function CreateFolderDrawer({
  refetch = () => {},
  onClose = () => {},
  chainFolder: chainFolderName,
  selectBucket: bucket,
  bucketAccountDetail: accountDetail,
  primarySp,
}) {
  const dispatch = useAppDispatch();
  const currentBucketName = useAppSelector((root) => root.object.currentBucketName);
  const pathSegments = useAppSelector((root) => root.object.pathSegments);
  const objectListRecords = useAppSelector((root) => root.object.objectListRecords);
  const completeCommonPrefix = useAppSelector((root) => root.object.completeCommonPrefix);
  const objectEditTagsData = useAppSelector((root) => root.object.objectEditTagsData);
  const gnfdGasFeesConfig = useAppSelector(selectGnfdGasFeesConfig);
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const bankBalance = useAppSelector((root) => root.accounts.bankOrWalletBalance);
  const storeFeeParams = useAppSelector(selectStoreFeeParams);

  const { connector } = useAccount();
  const { setOpenAuthModal } = useOffChainAuth();
  const checksumWorkerApi = useChecksumApi();
  const { PaymentAddress } = bucket;
  const { settlementFee } = useSettlementFee(PaymentAddress);
  const [balanceEnough, setBalanceEnough] = useState(true);
  const [loading, setLoading] = useState(false);
  const initFolderName = last(trimEnd(chainFolderName || '', '/').split('/'));
  const [inputFolderName, setInputFolderName] = useState(initFolderName || '');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [usedNames, setUsedNames] = useState<string[]>([]);

  const folderList =
    objectListRecords[completeCommonPrefix]?.filter((item) => item.objectName.endsWith('/')) || [];
  const isOwnerAccount = accountDetail.address === loginAccount;
  const validTags = getValidTags(objectEditTagsData);
  const isSetTags = validTags.length > 0;
  const { gasFee: createBucketGasFee } = gnfdGasFeesConfig?.[MsgCreateObjectTypeUrl] || {};
  const { gasFee: setTagsGasFee } = gnfdGasFeesConfig?.[MsgSetTagTypeUrl] || {};
  const lackGasFee = formErrors.includes(GET_GAS_FEE_LACK_BALANCE_ERROR);

  const gasFee = useMemo(() => {
    if (validTags.length === 0) {
      return createBucketGasFee || 0;
    }

    return BN(createBucketGasFee || 0)
      .plus(BN(setTagsGasFee || 0))
      .toNumber();
  }, [createBucketGasFee, setTagsGasFee, validTags.length]);

  const storeFee = useMemo(() => {
    if (isEmpty(storeFeeParams)) return '-1';
    const netflowRate = getStoreNetflowRate(0, storeFeeParams);
    const storeFee = BN(netflowRate).times(storeFeeParams.reserveTime);

    return storeFee.toString();
  }, [storeFeeParams]);

  const getPath = useCallback((name: string, folders: string[]) => {
    const parentFolderName = folders && folders[folders.length - 1];

    return parentFolderName && parentFolderName.length > 0
      ? `${folders.join('/')}/${name}/`
      : `${name}/`;
  }, []);

  const onCloseStatusModal = () => {
    dispatch(setSignatureAction({}));
  };

  const onEditTags = () => {
    dispatch(setObjectOperation({ level: 1, operation: ['', 'edit_tags'] }));
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
    const fullObjectName = getPath(inputFolderName, pathSegments);
    const txs: TxResponse[] = [];
    const [createObjectTx, error] = await simulateCreateFolderTx(fullObjectName);
    if (!createObjectTx || typeof error === 'string') {
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

    txs.push(createObjectTx);
    dispatch(
      setSignatureAction({
        icon: Animates.object,
        title: 'Creating Folder',
        desc: WALLET_CONFIRM,
      }),
    );

    if (isSetTags) {
      const [tagsTx, error2] = await getUpdateObjectTagsTx({
        address: loginAccount,
        bucketName: currentBucketName,
        objectName: fullObjectName,
        tags: validTags,
      });

      if (!tagsTx) {
        return dispatch(
          setSignatureAction({
            icon: 'status-failed',
            title: FOLDER_CREATE_FAILED,
            desc: FOLDER_DESCRIPTION_CREATE_ERROR,
            buttonText: BUTTON_GOT_IT,
            errorText: error2 ? `Error Message: ${error2}` : '',
          }),
        );
      }
      txs.push(tagsTx);
    }

    // 2. broadcast tx
    const [txRes, bcError] = await broadcastMulTxs({
      txs: txs,
      address: loginAccount,
      connector: connector!,
    });
    if (bcError) {
      setLoading(false);
      if (bcError === E_USER_REJECT_STATUS_NUM) {
        // onStatusModalClose();
        return;
      }
      dispatch(
        setSignatureAction({
          icon: 'status-failed',
          title: FOLDER_CREATE_FAILED,
          desc: FOLDER_DESCRIPTION_CREATE_ERROR,
          buttonText: BUTTON_GOT_IT,
          errorText: bcError ? `Error Message: ${bcError}` : '',
        }),
      );
      return;
    }
    await dispatch(setupAccountRecords(PaymentAddress));
    if (txRes?.code !== 0) {
      dispatch(
        setSignatureAction({
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
    const fullPath = getPath(inputFolderName, pathSegments);
    await legacyGetObjectMeta(currentBucketName, fullPath, primarySp.endpoint);

    setLoading(false);
    showSuccessToast(transactionHash);
    dispatch(setSignatureAction({}));
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
    if (folderNames.includes(value) && !chainFolderName) {
      errors.push('Folder name already exists.');
    }
    setFormErrors(errors);

    return !errors.length;
  };

  const simulateCreateFolderTx = async (
    fullFolderName: string,
    visibility: any = 'VISIBILITY_TYPE_INHERIT',
  ): Promise<ErrorResponse | [TxResponse, null]> => {
    // const fullPath = getPath(folderName, folders);
    const file = new File([], fullFolderName, { type: 'text/plain' });
    const { seedString } = await dispatch(
      getSpOffChainData(loginAccount, primarySp.operatorAddress),
    );
    const hashResult = await checksumWorkerApi?.generateCheckSumV2(file);
    const createObjectPayload: CreateObjectApprovalRequest = {
      bucketName: currentBucketName,
      objectName: fullFolderName,
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

    if (!createObjectTx) {
      return [null, createError];
    }

    const [simulateInfo, error] = await createObjectTx!
      .simulate({ denom: 'BNB' })
      .then(resolve, simulateFault);
    if (!simulateInfo) return [simulateInfo, error];

    return [createObjectTx, error];
  };

  const onFolderNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const folderName = e.target.value;
    setInputFolderName(folderName);
    if (usedNames.includes(folderName)) {
      setFormErrors([DUPLICATE_OBJECT_NAME]);
      return;
    }
    if (!lackGasFee) validateFolderName(folderName);
  };

  useAsyncEffect(async () => {
    if (isEmpty(storeFeeParams)) {
      dispatch(setupStoreFeeParams());
    }
  }, []);

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

  useUnmount(() => dispatch(setObjectEditTagsData([DEFAULT_TAG])));

  return (
    <>
      <QDrawerHeader flexDirection={'column'}>
        <Box>{chainFolderName ? 'Create on chain folder' : 'Create a Folder'}</Box>
        <Text className="ui-drawer-sub">
          {chainFolderName ? (
            'Convert your existing path to an on chain folder to view detailed data on the chain and obtain additional features.'
          ) : (
            <>
              Use folders to group objects in your bucket. Folder names can&apos;t contain
              &quot;/&quot;.
            </>
          )}
        </Text>
      </QDrawerHeader>
      <QDrawerBody>
        <Flex flexDirection="column" alignItems="center" gap={16}>
          <FormControl isInvalid={!!formErrors.length} w="100%">
            <FormLabel>
              <Text fontSize={14} fontWeight={500} mb={8}>
                Name
              </Text>
              <InputItem
                disabled={!!chainFolderName}
                onKeyDown={(e) => e.key === 'Enter' && onCreateFolder()}
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
          <FormControl w={'100%'} gap={8}>
            <FormLabel fontWeight={500}>Tags</FormLabel>
            <EditTags onClick={onEditTags} tagsData={validTags} />
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
        <PaymentInsufficientBalance
          gasFee={gasFee}
          storeFee={storeFee}
          settlementFee={settlementFee}
          refundFee={'0'}
          payGasFeeBalance={bankBalance}
          payStoreFeeBalance={accountDetail.staticBalance}
          ownerAccount={loginAccount}
          payAccount={accountDetail.address}
          onValidate={setBalanceEnough}
        />
        <Flex w="100%">
          <DCButton
            size="lg"
            w="100%"
            onClick={onCreateFolder}
            isDisabled={loading || !!formErrors.length || !balanceEnough}
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
