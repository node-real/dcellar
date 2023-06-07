import { ChangeEvent, memo, useEffect, useState } from 'react';
import {
  Flex,
  FormControl,
  Link,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Text,
  toast,
} from '@totejs/uikit';
import { DCModal } from '@/components/common/DCModal';
import { InputItem } from '@/modules/file/components/InputItem';
import { GasFeeItem } from '@/modules/file/components/GasFeeItem';
import { DCButton } from '@/components/common/DCButton';
import { WarningInfo } from '@/components/common/WarningInfo';
import { useLogin } from '@/hooks/useLogin';
import {
  BUTTON_GOT_IT,
  FILE_FAILED_URL,
  FILE_STATUS_UPLOADING,
  FOLDER_CREATE_FAILED,
  FOLDER_CREATING,
  FOLDER_DESCRIPTION_CREATE_ERROR,
  FOLDER_STATUS_CREATING,
  OBJECT_SEALED_STATUS,
  OBJECT_STATUS_FAILED,
  PENDING_ICON_URL,
  VisibilityType,
} from '@/modules/file/constant';
import { ErrorDisplay } from '@/modules/buckets/List/components/ErrorDisplay';
import { DotLoading } from '@/components/common/DotLoading';
import { TCreateObject } from '@bnb-chain/greenfield-chain-sdk';
import { getUtcZeroTimestamp } from '@/utils/time';
import { useAccount } from 'wagmi';
import { signTypedDataV4 } from '@/utils/signDataV4';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { removeTrailingSlash } from '@/utils/removeTrailingSlash';
import { USER_REJECT_STATUS_NUM } from '@/utils/constant';

interface modalProps {
  title?: string;
  endpoint: string;
  onClose: () => void;
  isOpen: boolean;
  description?: string;
  buttonText?: string;
  buttonOnClick?: () => void;
  errorText?: string;
  bucketName: string;
  folderName: string;
  fileName?: string;
  setStatusModalIcon: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalTitle: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalDescription: React.Dispatch<React.SetStateAction<string | JSX.Element>>;
  onStatusModalOpen: () => void;
  onStatusModalClose: () => void;
  setStatusModalButtonText: React.Dispatch<React.SetStateAction<string>>;
  setListObjects: React.Dispatch<React.SetStateAction<any[]>>;
  listObjects: Array<any>;
  setStatusModalErrorText: React.Dispatch<React.SetStateAction<string>>;
  fetchCreateObjectApproval: (file: File, newFileName?: string, visibility?: any) => any;
  createObjectData: {
    CreateObjectTx: any;
    configParam: TCreateObject;
  };
}

export const CreateFolderModal = memo<modalProps>(function CreateFolderModal(props) {
  const {
    title = 'Create a Folder',
    buttonText = 'Create',
    folderName: parentFolderName,
    bucketName,
    isOpen,
    createObjectData,
    listObjects,
    onClose,
    setListObjects,
    setStatusModalIcon,
    setStatusModalTitle,
    setStatusModalDescription,
    onStatusModalOpen,
    onStatusModalClose,
    setStatusModalButtonText,
    setStatusModalErrorText,
    fetchCreateObjectApproval,
  } = props;

  const {
    loginState: { address },
  } = useLogin();
  const { connector } = useAccount();
  const [loading, setLoading] = useState(false);
  const [gasFeeLoading, setGasFeeLoading] = useState(false);
  const [inputFolderName, setInputFolderName] = useState('');
  const [gasFee, setGasFee] = useState('-1');
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const getPath = (name: string) => {
    return parentFolderName && parentFolderName.length > 0
      ? `${parentFolderName}${name}/`
      : `${name}/`;
  };

  const setCreatingModalStatus = () => {
    onClose();
    setStatusModalIcon(PENDING_ICON_URL);
    setStatusModalTitle(FOLDER_CREATING);
    setStatusModalErrorText('');
    setStatusModalDescription(FILE_STATUS_UPLOADING);
    setStatusModalButtonText('');
    onStatusModalOpen();
  };

  const setFailedStatusModal = (description: string, error?: any) => {
    setStatusModalIcon(FILE_FAILED_URL);
    setStatusModalTitle(FOLDER_CREATE_FAILED);
    setStatusModalDescription(description);
    setStatusModalButtonText(BUTTON_GOT_IT);
    if (error && error.message) {
      setStatusModalErrorText('Error message: ' + error?.message ?? '');
    }
    onStatusModalOpen();
  };

  const getCreateFolderPayload = (objectName: string) => {
    const { configParam } = createObjectData;

    return {
      bucket_name: bucketName,
      object_name: objectName,
      owner: address,
      content_type: '',
      payload_size: '0',
      object_status: FOLDER_STATUS_CREATING,
      checksums: configParam.expectCheckSums,
      create_at: getUtcZeroTimestamp(),
      visibility: configParam.visibility,
    };
  };

  const broadcastCreateTx = async (createTx: any) => {
    const simulateInfo = await createTx.simulate({ denom: 'BNB' });
    const signTypeDataCallback = async (addr: string, message: string) => {
      const provider = await connector?.getProvider();
      return signTypedDataV4(provider, addr, message);
    };
    return createTx
      .broadcast({
        denom: 'BNB',
        gasLimit: Number(simulateInfo?.gasLimit),
        gasPrice: simulateInfo?.gasPrice || '5000000000',
        payer: address,
        signTypeDataCallback,
      })
      .catch((error: any) => {
        const { code = '' } = error;
        if (code && parseInt(code) === USER_REJECT_STATUS_NUM) {
          onStatusModalClose();
          return;
        }
        setFailedStatusModal(FOLDER_DESCRIPTION_CREATE_ERROR, error);
        // eslint-disable-next-line no-console
        console.error('Create folder error', error);
      });
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

  const updateFileListStatus = (objectName: string, status: number | string) => {
    setListObjects((list) =>
      list.map((row) => ({
        ...row,
        object_status: objectName === row?.object_name ? status : row.object_status,
      })),
    );
  };

  const onCreateFolder = async () => {
    const objectName = getPath(inputFolderName);
    setLoading(true);
    const CreateObjectTx = await fetchCreateFolderApproval(inputFolderName);
    if (!CreateObjectTx) {
      setLoading(false);
      return;
    }

    setCreatingModalStatus();
    const createFolderPayload = getCreateFolderPayload(objectName);

    if (!listObjects.some((item) => item.object_name === createFolderPayload.object_name)) {
      const fileUploadingLists = [createFolderPayload, ...listObjects];
      setListObjects(fileUploadingLists);
    }

    const txRes = await broadcastCreateTx(CreateObjectTx);
    if (txRes?.code !== 0) {
      updateFileListStatus(objectName, OBJECT_STATUS_FAILED);
      return;
    }
    onStatusModalClose();
    const { transactionHash } = txRes;
    showSuccessToast(transactionHash);
    updateFileListStatus(objectName, OBJECT_SEALED_STATUS);
  };

  const validateFolderName = (value: string) => {
    const errors = Array<string>();
    if (value === '') {
      errors.push('Folder name is required');
      setFormErrors(errors);
      return false;
    }
    if (!/^.{1,75}$/.test(value)) {
      errors.push('Must be between 1 to 75 characters long.');
    }
    if (value.includes('/')) {
      errors.push(`Folder name can\'t contain "/"`);
    }
    setFormErrors(errors);
    return !errors.length;
  };

  const fetchCreateFolderApproval = async (
    folderName: string,
    visibility = VisibilityType.VISIBILITY_TYPE_INHERIT,
  ) => {
    const fullPath = getPath(folderName);
    const file = new File([], fullPath, { type: 'text/plain' });

    const createObjectTx = await fetchCreateObjectApproval(file, fullPath, visibility).catch(
      (error: any) => {
        console.error('fetchCreateObjectApproval', error);
      },
    );
    if (!createObjectTx) return;

    setGasFeeLoading(true);
    const simulateInfo = await createObjectTx.simulate({ denom: 'BNB' });
    setGasFeeLoading(false);
    setGasFee(simulateInfo.gasFee);
    return createObjectTx;
  };

  const onFolderNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const folderName = e.target.value;
    setInputFolderName(folderName);
    validateFolderName(folderName);
  };

  useEffect(() => {
    if (isOpen) {
      setGasFeeLoading(true);
      fetchCreateFolderApproval('Untitled folder' + Date.now());
      return;
    }
    setInputFolderName('');
    setLoading(false);
    // eslint-disable-next-line
  }, [isOpen]);

  return (
    <DCModal
      isOpen={isOpen}
      onClose={onClose}
      p="48px 24px"
      w={568}
      overflow="hidden"
      gaShowName="dc.file.create_folder_m.0.show"
      gaClickCloseName="dc.file.create_folder_m.close.click"
    >
      <ModalCloseButton />
      <ModalHeader>{title}</ModalHeader>
      <Text
        align="center"
        color="readable.tertiary"
        mt={32}
        fontWeight={400}
        fontSize={18}
        lineHeight="22px"
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
              rules: ['Must be between 1 and 75 characters long.', 'Can\'t contain slash("/")'],
            }}
          />
          {formErrors && formErrors.length > 0 && <ErrorDisplay errorMsgs={formErrors} />}
        </FormControl>
        <GasFeeItem
          gasFee={gasFee}
          gaOptions={{
            gaShowName: 'dc.file.create_folder_m.transferin.show',
            gaClickName: 'dc.file.create_folder_m.transferin.click',
          }}
        />
        <ModalFooter w="100%">
          <Flex w="100%" flexDirection="column">
            <DCButton
              w="100%"
              variant="dcPrimary"
              onClick={onCreateFolder}
              isDisabled={loading || gasFeeLoading || !!formErrors.length}
              justifyContent="center"
              gaClickName="dc.file.upload_modal.confirm.click"
            >
              {loading ? (
                <>
                  Loading
                  <DotLoading />
                </>
              ) : (
                buttonText
              )}
            </DCButton>
            <WarningInfo content="Please be aware that data loss might occur during testnet phase." />
          </Flex>
        </ModalFooter>
      </Flex>
    </DCModal>
  );
});
