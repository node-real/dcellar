import {
  ModalCloseButton,
  ModalHeader,
  ModalFooter,
  Image,
  Text,
  Flex,
  toast,
  Box,
  Link,
  useOutsideClick,
} from '@totejs/uikit';
import { MenuCloseIcon } from '@totejs/icons';
import { useAccount, useNetwork } from 'wagmi';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { getAccount, CreateObjectTx, recoverPk, makeCosmsPubKey } from '@bnb-chain/gnfd-js-sdk';
import {
  generatePutObjectOptions,
  listObjectsByBucketName,
  VisibilityType,
} from '@bnb-chain/greenfield-storage-js-sdk';
import axios from 'axios';
import PrivateFileIcon from '@/public/images/icons/private_file.svg';
import PublicFileIcon from '@/public/images/icons/public_file.svg';

// TODO replace moment with dayjs
import moment from 'moment';

import { useLogin } from '@/hooks/useLogin';
import { GREENFIELD_CHAIN_EXPLORER_URL, GREENFIELD_CHAIN_RPC_URL } from '@/base/env';
import {
  BUTTON_GOT_IT,
  FETCH_OBJECT_APPROVAL_ERROR,
  FILE_DESCRIPTION_UPLOAD_ERROR,
  FILE_FAILED_URL,
  FILE_STATUS_UPLOADING,
  FILE_TITLE_UPLOAD_FAILED,
  FILE_TITLE_UPLOADING,
  FILE_UPLOAD_URL,
  OBJECT_CREATE_STATUS,
  OBJECT_STATUS_FAILED,
  OBJECT_STATUS_UPLOADING,
} from '@/modules/file/constant';
import {
  formatBytes,
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
import { useRouter } from 'next/router';
import { getDomain } from '@/utils/getDomain';
import { getOffChainData } from '@/modules/off-chain-auth/utils';

const renderFileInfo = (key: string, value: string) => {
  return (
    <Flex w={'100%'} flexDirection={'column'}>
      <Text
        fontSize={'12px'}
        lineHeight={'16px'}
        fontWeight={400}
        wordBreak={'break-all'}
        color={'readable.tertiary'}
        mb="4px"
      >
        {key}
      </Text>
      <Text
        fontSize={'14px'}
        lineHeight={'18px'}
        fontWeight={500}
        wordBreak={'break-all'}
        color={'readable.normal'}
        mb="8px"
      >
        {value}
      </Text>
    </Flex>
  );
};

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

// fixme There will be a fix to query only one uploaded object, but not the whole object list
const getObjectIsSealed = async (
  bucketName: string,
  endpoint: string,
  objectName: string,
  address: string,
) => {
  const domain = getDomain();
  const { seedString } = await getOffChainData(address);
  // TODO add auth error handling
  const listResult = await listObjectsByBucketName({
    bucketName,
    endpoint,
    userAddress: address,
    seedString,
    domain,
  });
  if (listResult) {
    const listObjects = listResult.body ?? [];
    const sealObjectIndex = listObjects
      .filter((v: any) => !v.removed)
      .map((v: any) => v.object_info)
      .findIndex((v: any) => v.object_name === objectName && v.object_status === 1);
    if (sealObjectIndex >= 0) {
      return listObjects[sealObjectIndex].seal_tx_hash;
    }
    return '';
  }
  return false;
};

const INITIAL_DELAY = 500; // ms
const POLLING_INTERVAL = 3000; // ms

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
  file?: File;
  fileName?: string;
  simulateGasFee: string;
  objectSignedMsg: any;
  gasLimit: number;
  lockFee: string;
  gasPrice: string;
  setStatusModalIcon: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalTitle: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalDescription: React.Dispatch<React.SetStateAction<string | JSX.Element>>;
  onStatusModalOpen: () => void;
  onStatusModalClose: () => void;
  outsideLoading: boolean;
  setStatusModalButtonText: React.Dispatch<React.SetStateAction<string>>;
  setListObjects: React.Dispatch<React.SetStateAction<any[]>>;
  listObjects: Array<any>;
  setStatusModalErrorText: React.Dispatch<React.SetStateAction<string>>;
  fetchCreateObjectApproval: any;
  getLockFeeAndSet: any;
  getGasFeeAndSet: any;
}

export const FileDetailModal = (props: modalProps) => {
  const loginData = useLogin();
  const { loginState } = loginData;
  const { address } = loginState;
  const { chain } = useNetwork();
  const { value: bnbPrice } = useContext(BnbPriceContext);
  const exchangeRate = bnbPrice?.toNumber() ?? 0;
  const createObjectTx = new CreateObjectTx(GREENFIELD_CHAIN_RPC_URL!, String(chain?.id)!);
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const { availableBalance } = useAvailableBalance();
  const timeoutRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const [isSealed, setIsSealed] = useState(false);
  const [visibility, setVisibility] = useState<string>(VisibilityType.VISIBILITY_TYPE_PRIVATE);
  const [showPanel, setShowPanel] = useState(false);
  const ref = useRef(null);
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
  const { connector } = useAccount();
  const {
    title,
    onClose,
    isOpen,
    file,
    buttonText = 'Confirm',
    buttonOnClick,
    errorText,
    fileName,
    bucketName,
    simulateGasFee,
    objectSignedMsg,
    gasLimit,
    gasPrice = '0',
    setStatusModalIcon,
    setStatusModalTitle,
    setStatusModalDescription,
    onStatusModalOpen,
    onStatusModalClose,
    setStatusModalButtonText,
    outsideLoading,
    lockFee,
    endpoint,
    setListObjects,
    listObjects,
    setStatusModalErrorText,
    fetchCreateObjectApproval,
    getLockFeeAndSet,
    getGasFeeAndSet,
  } = props;
  const router = useRouter();

  const startPolling = (makeRequest: any) => {
    timeoutRef.current = setTimeout(() => {
      makeRequest();
      intervalRef.current = setInterval(makeRequest, POLLING_INTERVAL);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }, INITIAL_DELAY);
  };

  const stopPolling = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  useEffect(() => {
    if (!simulateGasFee || Number(simulateGasFee) < 0 || !lockFee || Number(lockFee) < 0) {
      setButtonDisabled(false);
      return;
    }
    const currentBalance = Number(availableBalance);
    if (currentBalance >= Number(simulateGasFee) + Number(lockFee)) {
      setButtonDisabled(false);
      return;
    }
    setButtonDisabled(true);
  }, [simulateGasFee, lockFee]);

  useEffect(() => {
    if (isSealed) {
      stopPolling();
      setLoading(false);
      // fixme temp fix for list seal status display
      // We don't know yet why final name and size is changing if we open the modal again during uploading
      const finalObjects = listObjects.map((v, i) => {
        if (i === 0) {
          v.object_info.object_status = 1;
        }
        return v;
      });
      // const finalObjects = listObjects.map((v) => {
      //   if (v?.object_info?.object_name === finalName) {
      //     v.object_info.payload_size = file?.size ?? 0;
      //     v.object_info.object_status = 1;
      //   }
      //   return v;
      // });
      setListObjects(finalObjects);
      setIsSealed(false);
    }
    return () => {
      stopPolling();
    };
  }, [isSealed]);
  // todo consider optimise modal without file info
  if (!file) return <></>;

  const { name, size } = file;
  const finalName = fileName ? fileName : name;

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

  const handleUploadClick = async () => {
    try {
      setLoading(true);
      // close the file detail modal
      onClose();
      // set file status modal and open it
      setStatusModalIcon(FILE_UPLOAD_URL);
      setStatusModalTitle(FILE_TITLE_UPLOADING);
      setStatusModalErrorText('');
      setStatusModalDescription(FILE_STATUS_UPLOADING);
      setStatusModalButtonText('');
      // setIsSealed(false);
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

      const { sequence, accountNumber } = await getAccount(GREENFIELD_CHAIN_RPC_URL, address!);
      const walletProvider = await connector?.getProvider();
      const signInfo = await createObjectTx.signTx(
        {
          objectName: finalName,
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
        walletProvider,
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
        objectName: finalName,
        payloadSize: objectSignedMsg.payload_size,
        redundancyType: objectSignedMsg.redundancy_type,
        expectSecondarySpAddresses: objectSignedMsg.expect_secondary_sp_addresses,
      });
      let newFileInfo = {
        object_info: {
          bucket_name: bucketName,
          object_name: finalName,
          owner: address,
          content_type: file.type && file.type.length > 0 ? file.type : 'application/octet-stream',
          payload_size: '0',
          object_status: OBJECT_STATUS_UPLOADING,
          checksums: objectSignedMsg.expect_checksums,
          create_at: moment().unix(),
          visibility: visibilityTypeFromJSON(objectSignedMsg.visibility),
        },
        removed: false,
        lock_balance: 0,
      };
      const fileUploadingLists = [newFileInfo, ...listObjects];
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
                Transaction created successfully! View in{' '}
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
            duration: 3000,
          });
        } else {
          // eslint-disable-next-line no-console
          console.error('create object on chain error!', txRes);
          throw new Error('create object on chain error!');
        }
        // 2. upload file to sp server
        if (!file || !bucketName || !finalName || !objectTxnHash) {
          // eslint-disable-next-line no-console
          console.error('missing some of these: file, bucketName, objectName, objectTxnHash');
          throw new Error('missing some of these: file, bucketName, objectName, objectTxnHash');
        }

        // If upload size is small, then put obejct using fetch,
        // no need to show progress bar
        const domain = getDomain();
        const { seedString } = await getOffChainData(address);
        const uploadOptions = await generatePutObjectOptions({
          bucketName,
          objectName: finalName,
          body: file,
          endpoint: endpoint,
          txnHash: objectTxnHash,
          userAddress: address,
          domain,
          seedString,
        });
        const { url, headers } = uploadOptions;
        // No expiration handling is performed at this moment, because the previous step of obtaining quota has handled the situation where the seedString expires.
        await axios.put(url, file, {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded / (progressEvent.total as number)) * 100,
            );
            const currentProgressObjects = fileUploadingLists.map((v) => {
              if (v?.object_info?.object_name === finalName) {
                v.object_info.payload_size = size;
                v.object_info.progress = progress;
              }
              return v;
            });
            setListObjects(currentProgressObjects);
          },
          headers: {
            Authorization: headers.get('Authorization'),
            'X-Gnfd-Txn-hash': headers.get('X-Gnfd-Txn-hash'),
            'X-Gnfd-User-Address': headers.get('X-Gnfd-User-Address'),
            'X-Gnfd-App-Domain': headers.get('X-Gnfd-App-Domain'),
          },
        });
        startPolling(async () => {
          // todo use "getObjectMeta" to fetch object info, rather than fetch whole list
          const sealTxHash = await getObjectIsSealed(
            bucketName,
            endpoint,
            finalName,
            loginState.address,
          );
          if (sealTxHash && sealTxHash.length > 0) {
            setIsSealed(true);
            stopPolling();
            toast.success({
              description: (
                <>
                  File uploaded successfully! View in{' '}
                  <Link
                    color="#3C9AF1"
                    _hover={{ color: '#3C9AF1', textDecoration: 'underline' }}
                    href={`${removeTrailingSlash(GREENFIELD_CHAIN_EXPLORER_URL)}/tx/${sealTxHash}`}
                    isExternal
                  >
                    GreenfieldScan
                  </Link>
                  .
                </>
              ),
              duration: 3000,
            });
            // fixme This is a workaround to fix the issue that setIsSealed to true can't be monitored by useEffect Hook
            const newFileObjectStatus = listObjects[0].object_info.object_status;
            const isNewestList = listObjects[0].object_info.object_name === finalName;
            if (
              newFileObjectStatus === OBJECT_STATUS_UPLOADING ||
              newFileObjectStatus === OBJECT_CREATE_STATUS ||
              !isNewestList
            ) {
              router.reload();
            }
          } else {
            setIsSealed(false);
          }
        });
      } catch (error: any) {
        const errorListObjects = fileUploadingLists.map((v: any) => {
          if (v?.object_info?.object_name === finalName) {
            v.object_info.object_status = OBJECT_STATUS_FAILED;
          }
          return v;
        });
        setListObjects(errorListObjects);
        setLoading(false);
        // setIsSealed(false);
        // eslint-disable-next-line no-console
        console.error('file upload error', error);
        // It's said by UI designer to avoid popup warning modal if upload was failed
        // throw new Error(error);
      }
    } catch (error: any) {
      setLoading(false);
      // setIsSealed(false);
      const { code = '' } = error;
      if (code && parseInt(code) === USER_REJECT_STATUS_NUM) {
        onStatusModalClose();
        return;
      }
      setFailedStatusModal(FILE_DESCRIPTION_UPLOAD_ERROR, error);
      // eslint-disable-next-line no-console
      console.error('Upload file error', error);
    }
  };
  return (
    <DCModal
      isOpen={isOpen}
      onClose={onClose}
      w="568px"
      gaShowName="dc.file.upload_modal.0.show"
      gaClickCloseName="dc.file.upload_modal.close.click"
    >
      <ModalHeader>{title}</ModalHeader>
      <ModalCloseButton />
      <Flex mt="32px" flexDirection={'column'} alignItems={'center'} display={'flex'}>
        <Flex w="100%">
          <Image src={FILE_INFO_IMAGE_URL} w="120px" h="120px" mr={'24px'} alt="" />
          <Flex flex={1} flexDirection={'column'}>
            {/*{renderFileInfo('Name', finalName)}*/}

            {/*{renderFileInfo('Size', `${(size / 1024 / 1024).toFixed(2)} MB`)}*/}
            <Text
              fontSize={'14px'}
              lineHeight={'17px'}
              fontWeight={500}
              wordBreak={'break-all'}
              color={'readable.normal'}
              mb="8px"
            >
              {finalName}
            </Text>
            <Text
              fontSize={'12px'}
              lineHeight={'15px'}
              fontWeight={400}
              wordBreak={'break-all'}
              color={'readable.tertiary'}
              mb="8px"
            >
              {formatBytes(size)}
            </Text>
            <Flex position={'relative'} cursor={'pointer'}>
              <Text
                fontSize={'14px'}
                fontWeight={400}
                lineHeight={'24px'}
                color={'primary'}
                _hover={{ bg: 'rgba(0,186,52,0.1)' }}
                border={'1px solid #00ba34'}
                borderRadius={'18px'}
                paddingLeft={'12px'}
                paddingRight={'4px'}
                wordBreak={'break-all'}
                onClick={() => {
                  setShowPanel(true);
                }}
              >
                {transformVisibility(visibility)}
                <MenuCloseIcon
                  w={'18px'}
                  transform={showPanel ? 'rotate(180deg)' : 'rotate(0)'}
                  ml={'2px'}
                />
              </Text>
              <Flex
                position={'absolute'}
                w={'200px'}
                flexDirection={'column'}
                bg={'white'}
                top={'32px'}
                border={'1px solid #E6E8EA'}
                borderRadius={'8px'}
                paddingY={'8px'}
                visibility={showPanel ? 'visible' : 'hidden'}
                cursor={'pointer'}
              >
                <Flex
                  w={'100%'}
                  h={'32px'}
                  alignItems={'center'}
                  paddingLeft={'16px'}
                  _hover={{
                    bg:
                      visibility === VisibilityType.VISIBILITY_TYPE_PRIVATE
                        ? 'rgba(0,186,52,0.1)'
                        : 'bg.bottom',
                  }}
                  cursor={'pointer'}
                  bg={
                    visibility === VisibilityType.VISIBILITY_TYPE_PRIVATE
                      ? 'rgba(0,186,52,0.1)'
                      : 'bg.middle'
                  }
                  onClick={async () => {
                    try {
                      setLoading(true);
                      if (visibility === VisibilityType.VISIBILITY_TYPE_PRIVATE) return;
                      setVisibility(VisibilityType.VISIBILITY_TYPE_PRIVATE);
                      setShowPanel(false);
                      await fetchCreateObjectApproval(
                        file,
                        finalName,
                        VisibilityType.VISIBILITY_TYPE_PRIVATE,
                      );
                      setLoading(false);
                    } catch (error) {
                      toast.error({ description: FETCH_OBJECT_APPROVAL_ERROR });
                      console.error(FETCH_OBJECT_APPROVAL_ERROR, error);
                    }
                    // await getGasFeeAndSet(file, currentObjectSignedMessage);
                    // await getLockFeeAndSet(file.size);
                  }}
                >
                  <PrivateFileIcon style={{ marginRight: '6px' }} />
                  {transformVisibility(VisibilityType.VISIBILITY_TYPE_PRIVATE)}
                </Flex>
                <Flex
                  w={'100%'}
                  h={'32px'}
                  alignItems={'center'}
                  paddingLeft={'16px'}
                  _hover={{
                    bg:
                      visibility === VisibilityType.VISIBILITY_TYPE_PUBLIC_READ
                        ? 'rgba(0,186,52,0.1)'
                        : 'bg.bottom',
                  }}
                  cursor={'pointer'}
                  bg={
                    visibility === VisibilityType.VISIBILITY_TYPE_PUBLIC_READ
                      ? 'rgba(0,186,52,0.1)'
                      : 'bg.middle'
                  }
                  onClick={async () => {
                    try {
                      setLoading(true);
                      if (visibility === VisibilityType.VISIBILITY_TYPE_PUBLIC_READ) return;
                      setVisibility(VisibilityType.VISIBILITY_TYPE_PUBLIC_READ);
                      setShowPanel(false);
                      await fetchCreateObjectApproval(
                        file,
                        finalName,
                        VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
                      );
                      setLoading(false);
                      // await getGasFeeAndSet(file, currentObjectSignedMessage);
                      // await getLockFeeAndSet(file.size);
                    } catch (error) {
                      toast.error({ description: FETCH_OBJECT_APPROVAL_ERROR });
                      console.error(FETCH_OBJECT_APPROVAL_ERROR, error);
                    }
                  }}
                >
                  <PublicFileIcon style={{ marginRight: '6px' }} />
                  {transformVisibility(VisibilityType.VISIBILITY_TYPE_PUBLIC_READ)}
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
        <Flex
          w="100%"
          padding={'16px'}
          bg={'bg.secondary'}
          mt={'32px'}
          flexDirection={'column'}
          borderRadius="12px"
          gap={'4px'}
        >
          {renderFee(
            'Prelocked storage fee',
            lockFee,
            exchangeRate,
            <Tips
              iconSize={'14px'}
              containerWidth={'308px'}
              tips={
                <Box width={'308px'} p="8px 12px">
                  <Box
                    color={'readable.normal'}
                    fontSize="14px"
                    lineHeight="1.5"
                    wordBreak={'break-word'}
                  >
                    <Box as="p">
                      For uploading and storing files, besides transaction fee, Greenfield will
                      prelock a certain amount of BNB and charge the storage fee by a certain flow
                      rate.
                    </Box>
                  </Box>
                </Box>
              }
            />,
          )}
          {renderFee('Gas fee', simulateGasFee, exchangeRate)}
        </Flex>
        <Flex w={'100%'} justifyContent={'space-between'} mt="8px">
          {/*todo correct the error showing logics*/}
          <Text fontSize={'12px'} lineHeight={'16px'} color={'scene.danger.normal'}>
            {renderInsufficientBalance(simulateGasFee, lockFee, availableBalance || '0', {
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
              onClick={() => handleUploadClick()}
              isDisabled={loading || outsideLoading || buttonDisabled}
              justifyContent={'center'}
              gaClickName="dc.file.upload_modal.confirm.click"
            >
              {loading || outsideLoading ? (
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
