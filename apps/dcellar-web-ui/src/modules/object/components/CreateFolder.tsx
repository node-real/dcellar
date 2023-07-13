import { ChangeEvent, memo, useCallback, useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import {
  Flex,
  FormControl,
  Link,
  QDrawerBody,
  QDrawerCloseButton,
  QDrawerFooter,
  QDrawerHeader,
  Text,
  toast,
} from '@totejs/uikit';
import { InputItem } from '@/modules/file/components/InputItem';
import { GasFeeItem } from '@/modules/file/components/GasFeeItem';
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
  PENDING_ICON_URL,
  UNKNOWN_ERROR,
} from '@/modules/file/constant';
import { ErrorDisplay } from '@/modules/buckets/List/components/ErrorDisplay';
import { DotLoading } from '@/components/common/DotLoading';
import {
  MsgCreateObjectTypeUrl,
  TCreateObjectByOffChainAuth,
} from '@bnb-chain/greenfield-chain-sdk';
import { useAccount } from 'wagmi';
import { signTypedDataV4 } from '@/utils/signDataV4';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { removeTrailingSlash } from '@/utils/removeTrailingSlash';
import { GAClick, GAShow } from '@/components/common/GATracker';
import { InternalRoutePaths } from '@/constants/paths';
import {
  E_USER_REJECT_STATUS_NUM,
  broadcastFault,
  simulateFault,
  createTxFault,
  E_OFF_CHAIN_AUTH,
} from '@/facade/error';
import { useAppDispatch, useAppSelector } from '@/store';
import { genCreateObjectTx } from '@/modules/file/utils/genCreateObjectTx';
import { getDomain } from '@/utils/getDomain';
import { getSpOffChainData } from '@/store/slices/persist';
import { useChecksumApi } from '@/modules/checksum';
import { resolve } from '@/facade/common';
import { DCDrawer } from '@/components/common/DCDrawer';
import { TStatusDetail, setEditCreate, setStatusDetail } from '@/store/slices/object';
import { duplicateName } from '@/utils/object';
import { setupTmpAvailableBalance } from '@/store/slices/global';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';

interface modalProps {
  refetch: (name?: string) => void;
}

export const CreateFolder = memo<modalProps>(function CreateFolderDrawer({ refetch }) {
  const dispatch = useAppDispatch();
  const { connector } = useAccount();
  const checksumWorkerApi = useChecksumApi();
  const { bucketName, folders, objects, path, primarySp } = useAppSelector((root) => root.object);
  const { gasList = {} } = useAppSelector((root) => root.global.gasHub);
  const { gasFee } = gasList?.[MsgCreateObjectTypeUrl] || {};
  const { sps } = useAppSelector((root) => root.sp);
  const { loginAccount: address } = useAppSelector((root) => root.persist);
  const { _availableBalance: availableBalance } = useAppSelector((root) => root.global);
  const folderList = objects[path].filter((item) => item.objectName.endsWith('/'));
  const isOpen = useAppSelector((root) => root.object.editCreate);
  const { setOpenAuthModal } = useOffChainAuth();
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

  useEffect(() => {
    if (!isOpen) return;
    dispatch(setupTmpAvailableBalance(address));
  }, [isOpen, dispatch, address]);

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
        payer: address,
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
    if (duplicateName(value, folderList)) {
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
    const domain = getDomain();
    //@ts-ignore TODO
    const { seedString } = await dispatch(getSpOffChainData(address, primarySp.operatorAddress));
    const hashResult = await checksumWorkerApi?.generateCheckSumV2(file);
    const secondarySpAddresses = sps
      .filter((item: any) => item.operatorAddress !== primarySp.operatorAddress)
      .map((item: any) => item.operatorAddress);
    const spInfo = {
      endpoint: primarySp?.endpoint,
      primarySpAddress: primarySp?.operatorAddress,
      sealAddress: primarySp?.sealAddress,
      secondarySpAddresses,
    };
    const createObjectPayload: TCreateObjectByOffChainAuth = {
      bucketName,
      objectName: fullPath,
      creator: address,
      visibility,
      fileType: file.type,
      contentLength: file.size,
      expectCheckSums: hashResult?.expectCheckSums || [],
      spInfo,
      signType: 'offChainAuth',
      domain,
      seedString,
    };
    const [createObjectTx, createError] = await genCreateObjectTx(createObjectPayload).then(
      resolve,
      createTxFault,
    );

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
    const fee = BigNumber(gasFee);
    const balance = BigNumber(availableBalance || 0);
    if (fee.gte(0) && fee.gt(balance)) {
      setFormErrors([GET_GAS_FEE_LACK_BALANCE_ERROR]);
    }
  }, [gasFee, availableBalance]);

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
      <QDrawerCloseButton />
      <QDrawerHeader>Create a Folder</QDrawerHeader>
      <QDrawerBody>
        <Text
          align="center"
          color="readable.tertiary"
          mt={32}
          fontWeight={400}
          fontSize={18}
          lineHeight="22px"
          textAlign={'left'}
        >
          Use folders to group files in your bucket. Folder names can't contain "/".
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
          <GasFeeItem gasFee={gasFee + ''} />
          {lackGasFee && (
            <Flex w="100%" justifyContent="space-between" mt={8}>
              <Text fontSize={12} lineHeight="16px" color="scene.danger.normal">
                <GAShow name={'dc.file.create_folder_m.transferin.show'}>
                  Insufficient balance.&nbsp;
                  <GAClick name={'dc.file.create_folder_m.transferin.click'}>
                    <Link
                      href={InternalRoutePaths.transfer_in}
                      style={{ textDecoration: 'underline' }}
                      color="#EE3911"
                    >
                      Transfer in
                    </Link>
                  </GAClick>
                </GAShow>
              </Text>
            </Flex>
          )}
        </Flex>
      </QDrawerBody>
      <QDrawerFooter w="100%">
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
