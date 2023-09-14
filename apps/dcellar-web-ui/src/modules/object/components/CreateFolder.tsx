import { ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';
import {
  Flex,
  FormControl,
  Link,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Text,
  toast,
} from '@totejs/uikit';
import { InputItem } from '@/components/formitems/InputItem';
import { DCButton } from '@/components/common/DCButton';
import { WarningInfo } from '@/components/common/WarningInfo';
import {
  BUTTON_GOT_IT,
  DUPLICATE_OBJECT_NAME,
  FILE_FAILED_URL,
  FILE_STATUS_UPLOADING,
  FOLDER_CREATE_FAILED,
  FOLDER_CREATING,
  FOLDER_DESCRIPTION_CREATE_ERROR,
  GET_GAS_FEE_LACK_BALANCE_ERROR,
  LOCK_FEE_LACK_BALANCE_ERROR,
  PENDING_ICON_URL,
  UNKNOWN_ERROR,
} from '@/modules/file/constant';
import { ErrorDisplay } from '@/modules/buckets/List/components/ErrorDisplay';
import { DotLoading } from '@/components/common/DotLoading';
import { CreateObjectApprovalRequest, MsgCreateObjectTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { useAccount } from 'wagmi';
import { signTypedDataV4 } from '@/utils/signDataV4';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { removeTrailingSlash } from '@/utils/removeTrailingSlash';
import {
  E_USER_REJECT_STATUS_NUM,
  broadcastFault,
  simulateFault,
  createTxFault,
  E_OFF_CHAIN_AUTH,
} from '@/facade/error';
import { useAppDispatch, useAppSelector } from '@/store';
import { genCreateObjectTx } from '@/modules/file/utils/genCreateObjectTx';
import { getSpOffChainData } from '@/store/slices/persist';
import { useChecksumApi } from '@/modules/checksum';
import { resolve } from '@/facade/common';
import { DCDrawer } from '@/components/common/DCDrawer';
import { TStatusDetail, setEditCreate, setStatusDetail } from '@/store/slices/object';
import { selectStoreFeeParams, setupStoreFeeParams } from '@/store/slices/global';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { legacyGetObjectMeta } from '@/facade/object';
import { renderPaymentInsufficientBalance } from '@/modules/file/utils';
import { useAsyncEffect } from 'ahooks';
import { isEmpty } from 'lodash-es';
import { selectAccount, setupAccountDetail } from '@/store/slices/accounts';
import { getStoreNetflowRate } from '@/utils/payment';
import { BN } from '@/utils/BigNumber';
import { TotalFees } from './TotalFees';
import { useSettlementFee } from '@/hooks/useSettlementFee';

interface modalProps {
  refetch: (name?: string) => void;
}

export const CreateFolder = memo<modalProps>(function CreateFolderDrawer({ refetch }) {
  const dispatch = useAppDispatch();
  const { connector } = useAccount();

  const storeFeeParams = useAppSelector(selectStoreFeeParams);
  const checksumWorkerApi = useChecksumApi();
  const { primarySpInfo } = useAppSelector((root) => root.sp);
  const { bucketName, folders, objects, path } = useAppSelector((root) => root.object);
  const primarySp = primarySpInfo[bucketName];
  const { gasObjects = {} } = useAppSelector((root) => root.global.gasHub);
  const { gasFee } = gasObjects?.[MsgCreateObjectTypeUrl] || {};
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { bankBalance } = useAppSelector((root) => root.accounts);
  const { bucketInfo } = useAppSelector((root) => root.bucket);
  const folderList = objects[path]?.filter((item) => item.objectName.endsWith('/')) || [];
  const { PaymentAddress } = bucketInfo?.[bucketName] || {};
  const { settlementFee } = useSettlementFee(PaymentAddress);
  const accountDetail = useAppSelector(selectAccount(PaymentAddress));
  const isOpen = useAppSelector((root) => root.object.editCreate);
  const { setOpenAuthModal } = useOffChainAuth();
  const isOwnerAccount = accountDetail.address === loginAccount;
  const onClose = () => {
    dispatch(setEditCreate(false));
    // todo fix it
    document.documentElement.style.overflowY = '';
  };
  const onCloseStatusModal = () => {
    dispatch(setStatusDetail({} as TStatusDetail));
    // todo fix it
    document.documentElement.style.overflowY = '';
  };

  const [loading, setLoading] = useState(false);
  const [inputFolderName, setInputFolderName] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [usedNames, setUsedNames] = useState<string[]>([]);

  useAsyncEffect(async () => {
    if (!primarySp?.operatorAddress) return;
    if (isEmpty(storeFeeParams)) {
      return await dispatch(setupStoreFeeParams());
    }
  }, [primarySp?.operatorAddress]);

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
    const signTypedDataCallback = async (addr: string, message: string) => {
      const provider = await connector?.getProvider();
      return signTypedDataV4(provider, addr, message);
    };
    return createTx
      .broadcast({
        denom: 'BNB',
        gasLimit: Number(simulateInfo?.gasLimit),
        gasPrice: simulateInfo?.gasPrice || '5000000000',
        payer: loginAccount,
        granter: '',
        signTypedDataCallback,
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
        icon: PENDING_ICON_URL,
        title: FOLDER_CREATING,
        errorText: '',
        desc: FILE_STATUS_UPLOADING,
        buttonText: '',
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
          icon: FILE_FAILED_URL,
          title: FOLDER_CREATE_FAILED,
          desc: FOLDER_DESCRIPTION_CREATE_ERROR,
          buttonText: BUTTON_GOT_IT,
          errorText: bcError ? `Error Message: ${bcError}` : '',
          buttonOnClick: onCloseStatusModal,
        }),
      );
      return;
    }
    await dispatch(setupAccountDetail(PaymentAddress));
    if (txRes?.code !== 0) {
      dispatch(
        setStatusDetail({
          icon: FILE_FAILED_URL,
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
  const lackLockFee = formErrors.includes(LOCK_FEE_LACK_BALANCE_ERROR);
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
  }, [gasFee, bankBalance, storeFee, accountDetail.staticBalance, loginAccount, isOwnerAccount, storeFeeParams]);

  useEffect(() => {
    setFormErrors([]);
    setInputFolderName('');
    setLoading(false);
    setUsedNames([]);
  }, [isOpen]);

  return (
    <DCDrawer
      isOpen={isOpen}
      onClose={onClose}
      gaShowName="dc.file.create_folder_m.0.show"
      gaClickCloseName="dc.file.create_folder_m.close.click"
    >
      <QDrawerHeader>Create a Folder</QDrawerHeader>
      <QDrawerBody>
        <Text
          align="center"
          color="readable.tertiary"
          // mt={32}
          fontWeight={400}
          fontSize={18}
          lineHeight="22px"
          textAlign={'left'}
        >
          Use folders to group objects in your bucket. Folder names can't contain "/".
        </Text>
        <Flex mt={32} flexDirection="column" alignItems="center">
          <FormControl isInvalid={!!formErrors.length} w="100%">
            <InputItem
              value={inputFolderName}
              onChange={onFolderNameChange}
              tips={{
                title: 'Naming Rules',
                rules: ['Must be between 1 and 70 characters long.', 'Cannot consist of slash(/).'],
              }}
            />
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
        <Flex w="100%" flexDirection="column">
          <DCButton
            w="100%"
            variant="dcPrimary"
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
          <WarningInfo content="Please be aware that data loss might occur during testnet phase." />
        </Flex>
      </QDrawerFooter>
    </DCDrawer>
  );
});
