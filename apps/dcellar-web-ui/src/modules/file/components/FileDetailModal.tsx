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
} from '@totejs/uikit';
import { useAccount, useNetwork, useProvider } from 'wagmi';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { getAccount, CreateObjectTx } from '@bnb-chain/gnfd-js-sdk';
import {
  generatePutObjectOptions,
  listObjectsByBucketName,
} from '@bnb-chain/greenfield-storage-js-sdk';
import axios from 'axios';
import moment from 'moment';

import { useLogin } from '@/hooks/useLogin';
import { GREENFIELD_CHAIN_EXPLORER_URL, GRPC_URL } from '@/base/env';
import { recoverPk } from '@/modules/wallet/utils/pk/recoverPk';
import { makeCosmsPubKey } from '@/modules/wallet/utils/pk/makeCosmsPk';
import {
  BUTTON_GOT_IT,
  FILE_DESCRIPTION_UPLOAD_ERROR,
  FILE_FAILED_URL,
  FILE_STATUS_UPLOADING,
  FILE_TITLE_UPLOAD_FAILED,
  FILE_TITLE_UPLOADING,
  FILE_UPLOAD_URL,
  OBJECT_STATUS_FAILED,
  OBJECT_STATUS_UPLOADING,
} from '@/modules/file/constant';
import {
  renderBalanceNumber,
  renderFeeValue,
  renderInsufficientBalance,
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
const getObjectIsSealed = async (bucketName: string, endpoint: string, objectName: string) => {
  const listResult = await listObjectsByBucketName({
    bucketName,
    endpoint,
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
}

export const FileDetailModal = (props: modalProps) => {
  const loginData = useLogin();
  const { loginState } = loginData;
  const { address } = loginState;
  const { chain } = useNetwork();
  const { value: bnbPrice } = useContext(BnbPriceContext);
  const exchangeRate = bnbPrice?.toNumber() ?? 0;
  const createObjectTx = new CreateObjectTx(GRPC_URL!, String(chain?.id)!);
  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const { availableBalance } = useAvailableBalance();
  const timeoutRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const [isSealed, setIsSealed] = useState(false);
  const provider = useProvider();
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
  } = props;
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

      const { sequence, accountNumber } = await getAccount(GRPC_URL, address!);
      const provider = await connector?.getProvider();
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
          // fixme fix toast pop constantly when page switches
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
            duration: 5000,
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
        const uploadOptions = await generatePutObjectOptions({
          bucketName,
          objectName: finalName,
          body: file,
          endpoint: endpoint,
          txnHash: objectTxnHash,
        });
        const { url, headers } = uploadOptions;
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
          },
        });
        startPolling(async () => {
          // todo use "getObjectMeta" to fetch object info, rather than fetch whole list
          const sealTxHash = await getObjectIsSealed(bucketName, endpoint, finalName);
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
              duration: 5000,
            });
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
      p={'48px 24px'}
      w="568px"
      overflow="hidden"
      gaShowName="dc.file.upload_modal.0.show"
      gaClickCloseName="dc.file.upload_modal.close.click"
    >
      <ModalHeader>{title}</ModalHeader>
      <ModalCloseButton />
      <Flex mt="32px" flexDirection={'column'} alignItems={'center'} display={'flex'}>
        <Flex w="100%" overflow="hidden">
          <Image src={FILE_INFO_IMAGE_URL} w="120px" h="120px" mr={'24px'} alt="" />
          <Flex flex={1} flexDirection={'column'}>
            {renderFileInfo('Name', finalName)}
            {renderFileInfo('Size', `${(size / 1024 / 1024).toFixed(2)} MB`)}
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
