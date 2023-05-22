import {
  ModalCloseButton,
  ModalHeader,
  Modal,
  ModalFooter,
  Button,
  Image,
  Text,
  Flex,
  toast,
  Box,
  Link,
  useOutsideClick,
  InputGroup,
  Input,
  InputRightElement,
} from '@totejs/uikit';
import { MenuCloseIcon } from '@totejs/icons';
import { useAccount, useNetwork, useProvider } from 'wagmi';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getAccount, CreateObjectTx, ZERO_PUBKEY, makeCosmsPubKey } from '@bnb-chain/gnfd-js-sdk';
import {
  fetchWithTimeout,
  generateGetObjectOptions,
  getCreateObjectApproval,
  listObjectsByBucketName,
  VisibilityType,
} from '@bnb-chain/greenfield-storage-js-sdk';

import moment from 'moment';

import { useLogin } from '@/hooks/useLogin';
import { GREENFIELD_CHAIN_EXPLORER_URL, GRPC_URL } from '@/base/env';
import { recoverPk } from '@/modules/wallet/utils/pk/recoverPk';
import {
  BUTTON_GOT_IT,
  FILE_DESCRIPTION_UPLOAD_ERROR,
  FILE_FAILED_URL,
  FILE_STATUS_UPLOADING,
  FILE_TITLE_SP_REJECTED,
  FILE_TITLE_UPLOAD_FAILED,
  FILE_TITLE_UPLOADING,
  FILE_UPLOAD_URL,
  FOLDER_CREATING,
  FOLDER_STATUS_CREATING,
  GET_GAS_FEE_DEFAULT_ERROR,
  GET_GAS_FEE_LACK_BALANCE_ERROR,
  OBJECT_CREATE_STATUS,
  OBJECT_SEALED_STATUS,
  OBJECT_STATUS_FAILED,
  OBJECT_STATUS_UPLOADING,
} from '@/modules/file/constant';
import {
  formatBytes,
  getObjectIsSealed,
  renderBalanceNumber,
  renderFeeValue,
  renderInsufficientBalance,
  transformVisibility,
} from '@/modules/file/utils';
import { USER_REJECT_STATUS_NUM } from '@/utils/constant';
import { useAvailableBalance } from '@/hooks/useAvailableBalance';
import { DCModal } from '@/components/common/DCModal';
import { Tips } from '@/components/common/Tips';
import { DotLoading } from '@/components/common/DotLoading';
import { removeTrailingSlash } from '@/utils/removeTrailingSlash';
import { BnbPriceContext } from '@/context/GlobalContext/BnbPriceProvider';
import { WarningInfo } from '@/components/common/WarningInfo';
import { DCButton } from '@/components/common/DCButton';
import { FILE_INFO_IMAGE_URL } from '@/modules/file/constant';
import { visibilityTypeFromJSON } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/common';
import { debounce } from 'lodash-es';
import { getFee } from '@/modules/buckets/List/utils';
import BigNumber from 'bignumber.js';
import { parseError } from '@/modules/buckets/utils/parseError';
import { MIN_AMOUNT } from '@/modules/wallet/constants';
import { decodeFromHex } from '@/utils/hex';
import { getGasFeeBySimulate } from '@/modules/wallet/utils/simulate';
import { ErrorDisplay } from '@/modules/buckets/List/components/ErrorDisplay';

const renderFee = (
  key: string,
  bnbValue: string,
  exchangeRate: number,
  keyIcon?: React.ReactNode,
) => {
  return (
    <Flex w="100%" alignItems={'center'} justifyContent={'space-between'}>
      <Flex alignItems="center" mb="4px">
        <Text
          fontSize={'14px'}
          lineHeight={'28px'}
          fontWeight={400}
          color={'readable.tertiary'}
          as="p"
        >
          {key}
        </Text>
        {keyIcon && (
          <Box ml="6px" mt={'-1px'}>
            {keyIcon}
          </Box>
        )}
      </Flex>
      <Text fontSize={'14px'} lineHeight={'28px'} fontWeight={400} color={'readable.tertiary'}>
        {renderFeeValue(bnbValue, exchangeRate)}
      </Text>
    </Flex>
  );
};

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
  secondarySpAddresses: Array<any>;
}

export const CreateFolderModal = (props: modalProps) => {
  const loginData = useLogin();
  const { loginState } = loginData;
  const { address } = loginState;
  const { chain } = useNetwork();
  const { value: bnbPrice } = useContext(BnbPriceContext);
  const exchangeRate = bnbPrice?.toNumber() ?? 0;
  const createObjectTx = new CreateObjectTx(GRPC_URL!, String(chain?.id)!);
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [gasFee, setGasFee] = useState('-1');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const { availableBalance } = useAvailableBalance();
  const timeoutRef = useRef<any>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<string>(VisibilityType.VISIBILITY_TYPE_PRIVATE);
  const [showPanel, setShowPanel] = useState(false);
  const ref = useRef(null);
  const [gasFeeLoading, setGasFeeLoading] = useState(true);
  const [gasLimit, setGasLimit] = useState(0);
  const [gasPrice, setGasPrice] = useState('0');

  useOutsideClick({
    ref,
    handler: () => {
      if (showPanel) {
        setTimeout(() => {
          setShowPanel(false);
        }, 50);
      }
    },
  });
  const [objectSignedMsg, setObjectSignedMsg] = useState<any>();
  const provider = useProvider();
  const { connector } = useAccount();
  const {
    title = 'Create a Folder',
    onClose,
    isOpen,
    buttonText = 'Confirm',
    buttonOnClick,
    errorText,
    fileName,
    folderName: parentFolderName,
    bucketName,
    setStatusModalIcon,
    setStatusModalTitle,
    setStatusModalDescription,
    onStatusModalOpen,
    onStatusModalClose,
    setStatusModalButtonText,
    endpoint,
    setListObjects,
    listObjects,
    setStatusModalErrorText,
    secondarySpAddresses,
  } = props;
  console.log('folder endpoint', endpoint);

  useEffect(() => {
    if (!gasFee || Number(gasFee) < 0) {
      setButtonDisabled(false);
      return;
    }
    const currentBalance = Number(availableBalance);
    if (currentBalance >= Number(gasFee)) {
      setButtonDisabled(false);
      return;
    }
    setButtonDisabled(true);
  }, [gasFee]);

  // const validateAndSetGasFee = useCallback(
  //     debounce(async (folderName) => {
  //       const objectMsg = await fetchCreateFolderApproval(folderName,endpoint);
  //       await getGasFeeAndSet(objectMsg);
  //     }, 500)
  //     ,[endpoint]);

  const getApprovalAndGasFee = useCallback(
    async (folderName: string) => {
      debugger;
      const objectMsg = await fetchCreateFolderApproval(folderName, endpoint);
      await getGasFeeAndSet(objectMsg);
    },
    [endpoint],
  );
  const validateAndSetGasFee = debounce(getApprovalAndGasFee, 500);

  const validateNameRules = useCallback(
    (value: string) => {
      const types: { [key: string]: string } = {};
      if (Number(availableBalance) < 0) {
        types['validateBalance'] = '';
      }
      if (value === '') {
        types['required'] = 'Folder name is required';
      }
      if (value !== '' && !/^.{1,100}$/.test(value)) {
        types['validateLen'] = 'Must be between 1 to 100 characters long.';
      }
      if (value.includes('/')) {
        types['validateChar'] = `Folder name can't contain "/"`;
      }
      return types;
    },
    [availableBalance],
  );

  const setFailedStatusModal = (description: string, error?: any) => {
    onStatusModalClose();
    setStatusModalIcon(FILE_FAILED_URL);
    setStatusModalTitle(FILE_TITLE_UPLOAD_FAILED);
    setStatusModalDescription(description);
    setStatusModalButtonText(BUTTON_GOT_IT);
    if (error && error.message) {
      setStatusModalErrorText('Error message: ' + error?.message ?? '');
    }
    onStatusModalOpen();
  };

  const getGasFeeAndSet = async (currentObjectSignedMessage: any) => {
    try {
      setGasFeeLoading(true);
      const { sequence } = await getAccount(GRPC_URL!, address!);
      const simulateBytes = createObjectTx.getSimulateBytes({
        objectName: currentObjectSignedMessage.object_name,
        contentType: currentObjectSignedMessage.content_type,
        from: currentObjectSignedMessage.creator,
        bucketName: currentObjectSignedMessage.bucket_name,
        expiredHeight: currentObjectSignedMessage.primary_sp_approval.expired_height,
        sig: currentObjectSignedMessage.primary_sp_approval.sig,
        visibility: currentObjectSignedMessage.visibility,
        payloadSize: currentObjectSignedMessage.payload_size,
        expectChecksums: currentObjectSignedMessage.expect_checksums,
        redundancyType: currentObjectSignedMessage.redundancy_type,
        expectSecondarySpAddresses: currentObjectSignedMessage.expect_secondary_sp_addresses,
      });
      const authInfoBytes = createObjectTx.getAuthInfoBytes({
        sequence: sequence.toString(),
        denom: 'BNB',
        gasLimit: 0,
        gasPrice: '0',
        pubKey: makeCosmsPubKey(ZERO_PUBKEY),
      });
      const simulateGas = await createObjectTx.simulateTx(simulateBytes, authInfoBytes);
      setGasFee(getGasFeeBySimulate(simulateGas));
      setGasLimit(simulateGas.gasInfo?.gasUsed.toNumber() || 0);
      setGasPrice(simulateGas.gasInfo?.minGasPrice.replaceAll('BNB', '') || '0');
      setGasFeeLoading(false);
    } catch (error: any) {
      setGasFeeLoading(false);
      setGasFee('-1');
      if (error.message.includes('Object already exists')) {
        // todo add error object text under input
        // setDuplicateNameModalDescription(
        //     `${uploadFile.name} is already existed in current bucket. Do you want to automatically rename it to keep both files?`,
        // );
      } else {
        setStatusModalIcon(FILE_FAILED_URL);
        setStatusModalTitle('Chain Rejected');
        if (
          error.message.includes('lack of') ||
          error.message.includes('static balance is not enough')
        ) {
          // todo get the number of lacking money
          setStatusModalDescription(GET_GAS_FEE_LACK_BALANCE_ERROR);
        } else {
          setStatusModalDescription(GET_GAS_FEE_DEFAULT_ERROR);
          setStatusModalErrorText('Error message: ' + error?.message ?? '');
        }
        onStatusModalOpen();
      }
      // eslint-disable-next-line no-console
      console.error('Get gas fee error', error);
      return;
    }
  };
  const fetchCreateFolderApproval = async (
    folderName: string,
    endpoint: string,
    visibility = VisibilityType.VISIBILITY_TYPE_PRIVATE,
  ) => {
    try {
      setLoading(true);
      const finalObjectName =
        parentFolderName && parentFolderName.length > 0
          ? `${parentFolderName}${folderName}/`
          : `${folderName}/`;
      const file = new File([], finalObjectName, { type: 'text/plain' });
      if (!endpoint) {
        toast.error({
          description: 'endpoint is null',
        });
        return;
      }
      const result = await getCreateObjectApproval({
        bucketName,
        objectName: finalObjectName,
        creator: address,
        file: file,
        endpoint,
        expectSecondarySpAddresses: secondarySpAddresses,
        visibility,
      });
      if (result.statusCode !== 200) {
        throw new Error(`Error code: ${result.statusCode}, message: ${result.message}`);
      }
      let currentObjectSignedMessage = JSON.parse(decodeFromHex(result.body));
      console.log('object signed message', currentObjectSignedMessage);
      setObjectSignedMsg(currentObjectSignedMessage);
      setLoading(false);
      return currentObjectSignedMessage;
    } catch (error: any) {
      setGasFeeLoading(false);
      setStatusModalIcon(FILE_FAILED_URL);
      setStatusModalTitle(FILE_TITLE_SP_REJECTED);
      setStatusModalErrorText('Error message: ' + error?.message ?? '');
      setStatusModalDescription('');
      onStatusModalOpen();
      // eslint-disable-next-line no-console
      console.error('Sp get object approval error', error);
      return Promise.reject();
    }
  };

  const createFolder = async () => {
    try {
      setLoading(true);
      // close the file detail modal
      onClose();
      // set file status modal and open it
      setStatusModalIcon(FILE_UPLOAD_URL);
      setStatusModalTitle(FOLDER_CREATING);
      setStatusModalErrorText('');
      setStatusModalDescription(FILE_STATUS_UPLOADING);
      setStatusModalButtonText('');
      onStatusModalOpen();
      // 1. execute create object on chain
      if (!objectSignedMsg) {
        setFailedStatusModal('Get Object Approval failed, please check.');
        return;
      }
      if (address !== objectSignedMsg.creator) {
        setFailedStatusModal('Account address is not available');
        return;
      }

      const { sequence, accountNumber } = await getAccount(GRPC_URL, address!);
      const provider = await connector?.getProvider();
      const signInfo = await createObjectTx.signTx(
        {
          objectName: objectSignedMsg.object_name,
          contentType: objectSignedMsg.content_type,
          from: objectSignedMsg.creator,
          bucketName,
          sequence: sequence + '',
          accountNumber: accountNumber + '',
          denom: 'BNB',
          gasLimit,
          gasPrice,
          expiredHeight: objectSignedMsg.primary_sp_approval.expired_height,
          sig: objectSignedMsg.primary_sp_approval.sig,
          visibility: objectSignedMsg.visibility,
          payloadSize: objectSignedMsg.payload_size,
          expectChecksums: objectSignedMsg.expect_checksums,
          redundancyType: objectSignedMsg.redundancy_type,
          expectSecondarySpAddresses: objectSignedMsg.expect_secondary_sp_addresses,
        },
        provider,
      );

      const pk = recoverPk({
        signature: signInfo.signature,
        messageHash: signInfo.messageHash,
      });
      const pubKey = makeCosmsPubKey(pk);
      const rawBytes = await createObjectTx.getRawTxInfo({
        bucketName,
        denom: 'BNB',
        from: address,
        gasLimit,
        gasPrice,
        pubKey,
        sequence: sequence + '',
        accountNumber: accountNumber + '',
        sign: signInfo.signature,
        expiredHeight: objectSignedMsg.primary_sp_approval.expired_height,
        sig: objectSignedMsg.primary_sp_approval.sig,
        visibility: objectSignedMsg.visibility,
        contentType: objectSignedMsg.content_type,
        expectChecksums: objectSignedMsg.expect_checksums,
        objectName: objectSignedMsg.object_name,
        payloadSize: objectSignedMsg.payload_size,
        redundancyType: objectSignedMsg.redundancy_type,
        expectSecondarySpAddresses: objectSignedMsg.expect_secondary_sp_addresses,
      });
      let newFolderInfo = {
        bucket_name: bucketName,
        object_name: objectSignedMsg.object_name,
        owner: address,
        content_type: '',
        payload_size: '0',
        object_status: FOLDER_STATUS_CREATING,
        checksums: objectSignedMsg.expect_checksums,
        create_at: moment().unix(),
        visibility: visibilityTypeFromJSON(objectSignedMsg.visibility),
      };
      const fileUploadingLists = [newFolderInfo, ...listObjects];
      setListObjects(fileUploadingLists);
      onStatusModalClose();
      try {
        const txRes = await createObjectTx.broadcastTx(rawBytes.bytes);
        let objectTxnHash = '';
        if (txRes.code === 0) {
          objectTxnHash = txRes.transactionHash;
          toast.success({
            description: (
              <>
                Folder created successfully! View in{' '}
                <Link
                  color="#3C9AF1"
                  _hover={{ color: '#3C9AF1', textDecoration: 'underline' }}
                  href={`${removeTrailingSlash(
                    GREENFIELD_CHAIN_EXPLORER_URL,
                  )}/tx/0x${objectTxnHash}`}
                  isExternal
                >
                  GreenfieldScan
                </Link>
                .
              </>
            ),
            duration: 5000,
          });
          const successListObjects = fileUploadingLists.map((v: any) => {
            if (v?.object_name === objectSignedMsg.object_name) {
              v.object_status = OBJECT_SEALED_STATUS;
            }
            return v;
          });
          setListObjects(successListObjects);
        } else {
          // eslint-disable-next-line no-console
          console.error('create folder on chain error!');
          throw new Error('create folder on chain error!');
        }
      } catch (error: any) {
        const errorListObjects = fileUploadingLists.map((v: any) => {
          if (v?.object_name === objectSignedMsg.object_name) {
            v.object_status = OBJECT_STATUS_FAILED;
          }
          return v;
        });
        setListObjects(errorListObjects);
        setLoading(false);
        console.error('folder created error', error);
      }
    } catch (error: any) {
      setLoading(false);
      const { code = '' } = error;
      if (code && parseInt(code) === USER_REJECT_STATUS_NUM) {
        onStatusModalClose();
        return;
      }
      setFailedStatusModal(FILE_DESCRIPTION_UPLOAD_ERROR, error);
      // eslint-disable-next-line no-console
      console.error('Create folder error', error);
    }
  };

  const handleInputChange = useCallback(
    (event: any) => {
      const currentFolderName = event.target.value;
      setFolderName(currentFolderName);

      // 1. validate name rules
      const types = validateNameRules(currentFolderName);
      if (Object.values(types).length > 0) {
        setFormErrors(Object.values(types));
        setGasFee('-1');
        return;
      } else {
        setFormErrors([]);
      }

      // 2. Async validate balance is afford gas fee and relayer fee and bucket name is available
      validateAndSetGasFee(currentFolderName);
    },
    // [checkGasFee, clearErrors, setError, setValue, validateNameRules],
    [],
  );
  return (
    <DCModal
      isOpen={isOpen}
      onClose={onClose}
      p={'48px 24px'}
      w="568px"
      overflow="hidden"
      gaShowName="dc.file.upload_modal.0.show"
      gaClickCloseName="dc.file.upload_modal.close.click"
    >
      <ModalHeader>{title}</ModalHeader>
      <Text
        color={'readable.tertiary'}
        mt={'32px'}
        fontWeight={400}
        fontSize={'18px'}
        lineHeight={'22px'}
      >
        Use folders to group files in your bucket. Folder names can't contain "/".
      </Text>
      <ModalCloseButton />
      <Flex mt="32px" flexDirection={'column'} alignItems={'center'} display={'flex'}>
        <InputGroup>
          <Input
            autoFocus
            autoComplete="off"
            type="text"
            id="bucketName"
            border="1px solid #EAECF0"
            placeholder="Enter a folder name"
            fontSize="16px"
            lineHeight={'19px'}
            fontWeight={500}
            height="52px"
            onChange={handleInputChange}
            // onChange={async (e) => {
            //   const newestFolderName=e.target.value;
            //   setFolderName(newestFolderName);
            //   validateAndSetGasFee(newestFolderName)
            // }}
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
                      Must be between 1 and 50 characters long.
                    </Box>
                    <Box as="li" marginBottom={'4px'}>
                      Can't not include "/"
                    </Box>
                  </Box>
                </Box>
              }
            />
          </InputRightElement>
        </InputGroup>
        {formErrors && formErrors.length > 0 && <ErrorDisplay errorMsgs={formErrors} />}
        <Flex
          w="100%"
          padding={'16px'}
          bg={'bg.secondary'}
          mt={'32px'}
          flexDirection={'column'}
          borderRadius="12px"
          gap={'4px'}
        >
          {renderFee('Gas fee', gasFee, exchangeRate)}
        </Flex>
        <Flex w={'100%'} justifyContent={'space-between'} mt="8px">
          {/*todo correct the error showing logics*/}
          <Text fontSize={'12px'} lineHeight={'16px'} color={'scene.danger.normal'}>
            {renderInsufficientBalance(gasFee, '0', availableBalance || '0', {
              gaShowName: 'dc.file.upload_modal.transferin.show',
              gaClickName: 'dc.file.upload_modal.transferin.click',
            })}
          </Text>
          <Text fontSize={'12px'} lineHeight={'16px'} color={'readable.disabled'}>
            Available balance: {renderBalanceNumber(availableBalance || '0')}
          </Text>
        </Flex>
      </Flex>
      <ModalFooter>
        {buttonText && (
          <Flex width={'100%'} flexDirection={'column'}>
            <DCButton
              w="100%"
              variant={'dcPrimary'}
              onClick={() => {
                // handleUploadClick()
                createFolder();
              }}
              isDisabled={
                loading || buttonDisabled || gasFeeLoading || (formErrors && formErrors.length > 0)
              }
              justifyContent={'center'}
              gaClickName="dc.file.upload_modal.confirm.click"
            >
              {loading || gasFeeLoading ? (
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
        )}
      </ModalFooter>
    </DCModal>
  );
};
