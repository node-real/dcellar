import React, { ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  Row,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtual } from '@tanstack/react-virtual';
import {
  Box,
  CenterProps,
  Circle,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuItemProps,
  MenuList,
  SkeletonSquare,
  Text,
  Image,
  Tooltip,
  toast,
  useDisclosure,
} from '@totejs/uikit';
import { useWindowSize } from 'react-use';
import { DownloadIcon, FileIcon } from '@totejs/icons';
import { useNetwork } from 'wagmi';
import {
  CancelCreateObjectTx,
  DelObjectTx,
  getAccount,
  ZERO_PUBKEY,
  makeCosmsPubKey,
} from '@bnb-chain/gnfd-js-sdk';

import MenuIcon from '@/public/images/icons/menu.svg';
import ShareIcon from '@/public/images/icons/share.svg';
import { makeData } from './makeData';
import { useLogin } from '@/hooks/useLogin';
import { getLockFee } from '@/utils/wallet';
import {
  BUTTON_GOT_IT,
  FILE_DOWNLOAD_URL,
  FILE_EMPTY_URL,
  FILE_STATUS_DOWNLOADING,
  FILE_TITLE_DOWNLOAD_FAILED,
  FILE_TITLE_DOWNLOADING,
  GET_GAS_FEE_DEFAULT_ERROR,
  GET_GAS_FEE_LACK_BALANCE_ERROR,
  GET_LOCK_FEE_ERROR,
  NOT_ENOUGH_QUOTA,
  NOT_ENOUGH_QUOTA_ERROR,
  NOT_ENOUGH_QUOTA_URL,
  OBJECT_CREATE_STATUS,
  OBJECT_SEALED_STATUS,
  OBJECT_STATUS_FAILED,
  OBJECT_STATUS_UPLOADING,
} from '@/modules/file/constant';
import { GREENFIELD_CHAIN_RPC_URL } from '@/base/env';
import { getGasFeeBySimulate } from '@/modules/wallet/utils/simulate';
import { FileInfoModal } from '@/modules/file/components/FileInfoModal';
import { ConfirmDownloadModal } from '@/modules/file/components/ConfirmDownloadModal';
import { ConfirmViewModal } from '@/modules/file/components/ConfirmViewModal';
import { ConfirmDeleteModal } from '@/modules/file/components/ConfirmDeleteModal';
import { ConfirmCancelModal } from '@/modules/file/components/ConfirmCancelModal';
import {
  contentTypeToExtension,
  directlyDownload,
  formatBytes,
  downloadWithProgress,
  getQuota,
  viewFileByAxiosResponse,
  saveFileByAxiosResponse,
} from '@/modules/file/utils';
import { formatTime, getMillisecond } from '@/modules/buckets/utils/formatTime';
import { ShareModal } from '@/modules/file/components/ShareModal';
// import PublicFileIcon from '@/public/images/icons/public_file.svg';
import PublicFileIcon from '@/modules/file/components/PublicFileIcon';
import { GAClick, GAShow } from '@/components/common/GATracker';
import { useOffChainAuth } from '@/hooks/useOffChainAuth';
import { checkSpOffChainDataAvailable, getOffChainData } from '@/modules/off-chain-auth/utils';

interface GreenfieldMenuItemProps extends MenuItemProps {
  gaClickName?: string;
}

const PUBLIC_FILE_ICON_PATH = '/images/icons/public_file.svg';
const GreenfieldMenuItem = (props: GreenfieldMenuItemProps) => {
  const { children, onClick, gaClickName, ...rest } = props;

  const onBeforeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <GAClick name={gaClickName}>
      <MenuItem
        _hover={{ bg: 'rgba(0, 186, 52, 0.1)', color: 'readable.brand7' }}
        onClick={onBeforeClick}
        {...rest}
      >
        {children}
      </MenuItem>
    </GAClick>
  );
};

interface fileListProps {
  listObjects: any;
  bucketName: string;
  endpoint: string;
  spAddress: string;
  primarySpSealAddress: string;
  isLoading: boolean;
  setListObjects: React.Dispatch<React.SetStateAction<any[]>>;
  setStatusModalIcon: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalTitle: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalDescription: React.Dispatch<React.SetStateAction<string | JSX.Element>>;
  onStatusModalOpen: () => void;
  onStatusModalClose: () => void;
  setStatusModalButtonText: React.Dispatch<React.SetStateAction<string>>;
  setStatusModalErrorText: React.Dispatch<React.SetStateAction<string>>;
}

const isSealed = (info: any) => {
  const { object_status } = info;
  return object_status === OBJECT_SEALED_STATUS;
};

const TableText = (props: any) => {
  const { info, children, w, color = 'inherit', ...restProps } = props;
  const textColor = isSealed(info) ? color : 'readable.disabled';
  return (
    <Text
      color={textColor}
      noOfLines={1}
      whiteSpace={'pre'}
      w={w}
      textOverflow="ellipsis"
      overflow="hidden"
      {...restProps}
    >
      {children}
    </Text>
  );
};
const UploadProgress = (props: { progress: number }) => {
  let { progress = 0 } = props;
  // As progress will stay put for a while in 100%, user might get confused,
  // so we hold the progress to 99% at mostbg
  if (progress >= 99) {
    progress = 99;
  }
  if (progress < 0) {
    progress = 0;
  }
  return (
    <Flex alignItems={'center'}>
      <Flex w={'84px'} h={'8px'} bg={'#E7F3FD'} borderRadius={'28px'} overflow={'hidden'}>
        <Flex w={`${progress}%`} bg={'#1184EE'} borderRadius={'28px'} />
      </Flex>
      <Text
        color={'readable.normal'}
        ml={'4px'}
        fontSize={'12px'}
        lineHeight={'15px'}
        fontWeight={400}
      >{`${progress}%`}</Text>
    </Flex>
  );
};

interface ActionButtonProps extends CenterProps {
  gaClickName?: string;
}

function ActionButton(props: ActionButtonProps) {
  const { children, onClick, gaClickName, ...restProps } = props;

  const onBeforeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <GAClick name={gaClickName}>
      <Circle
        className="btn-action"
        boxSize={24}
        visibility={'hidden'}
        bg="rgba(0, 186, 52, 0.1)"
        flexShrink={0}
        cursor="pointer"
        borderRadius={18}
        transitionProperty="colors"
        transitionDuration="normal"
        _hover={{
          bgColor: 'rgba(0, 186, 52, 0.2)',
          color: 'readable.brand6',
        }}
        onClick={onBeforeClick}
        {...restProps}
      >
        {children}
      </Circle>
    </GAClick>
  );
}

export const FileTable = (props: fileListProps) => {
  const {
    listObjects,
    bucketName,
    endpoint,
    spAddress,
    primarySpSealAddress,
    isLoading = false,
    setListObjects,
    setStatusModalIcon,
    setStatusModalTitle,
    setStatusModalDescription,
    onStatusModalOpen,
    onStatusModalClose,
    setStatusModalButtonText,
    setStatusModalErrorText,
  } = props;
  const loginData = useLogin();
  const { loginState } = loginData;
  const { allowDirectDownload, address, allowDirectView } = loginState;
  const { chain } = useNetwork();
  const flatData = useMemo(() => {
    return listObjects
      .filter((v: any) => !v.removed)
      .map((v: any) => v.object_info)
      .sort((a: any, b: any) => Number(b.create_at) - Number(a.create_at));
  }, [listObjects]);
  const [fileInfo, setFileInfo] = useState<any>();
  const [createdDate, setCreatedDate] = useState(0);
  const [hash, setHash] = useState('');
  const [gasFeeLoading, setGasFeeLoading] = useState(true);
  const [lockFeeLoading, setLockFeeLoading] = useState(true);
  const [gasFee, setGasFee] = useState('-1');
  const [lockFee, setLockFee] = useState('-1');
  const [gasLimit, setGasLimit] = useState(0);
  const [gasPrice, setGasPrice] = useState('0');
  const [shareLink, setShareLink] = useState('');
  const [viewLink, setViewLink] = useState('');
  const { setOpenAuthModal } = useOffChainAuth();
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [currentVisibility, setCurrentVisibility] = useState(0);
  const { width, height } = useWindowSize();
  const containerWidth = useMemo(() => {
    const newWidth = width > 1000 ? width : 1000;
    return newWidth - 269 - 24 - 24;
  }, [width]);

  const tableFullHeight = useMemo(() => {
    return height - 65 - 48 - 24 - 60;
  }, [height]);

  const skeletonData = useMemo(() => {
    return makeData(Math.floor(tableFullHeight / 56) - 1);
  }, [tableFullHeight]);
  const finalData = isLoading ? skeletonData : flatData;
  const {
    isOpen: isInfoModalOpen,
    onOpen: onInfoModalOpen,
    onClose: onInfoModalClose,
  } = useDisclosure();
  const {
    isOpen: isConfirmDownloadModalOpen,
    onOpen: onConfirmDownloadModalOpen,
    onClose: onConfirmDownloadModalClose,
  } = useDisclosure();
  const {
    isOpen: isConfirmViewModalOpen,
    onOpen: onConfirmViewModalOpen,
    onClose: onConfirmViewModalClose,
  } = useDisclosure();
  const {
    isOpen: isConfirmDeleteModalOpen,
    onOpen: onConfirmDeleteModalOpen,
    onClose: onConfirmDeleteModalClose,
  } = useDisclosure();
  const {
    isOpen: isConfirmCancelModalOpen,
    onOpen: onConfirmCancelModalOpen,
    onClose: onConfirmCancelModalClose,
  } = useDisclosure();
  const {
    isOpen: isShareModalOpen,
    onOpen: onShareModalOpen,
    onClose: onShareModalClose,
  } = useDisclosure();

  const setCloseAllAndShowAuthModal = useCallback(() => {
    onInfoModalClose();
    onConfirmDownloadModalClose();
    onConfirmViewModalClose();
    onConfirmDeleteModalClose();
    onConfirmCancelModalClose();
    onShareModalClose();
    setOpenAuthModal();
  }, [
    onConfirmCancelModalClose,
    onConfirmDeleteModalClose,
    onConfirmDownloadModalClose,
    onConfirmViewModalClose,
    onInfoModalClose,
    onShareModalClose,
    setOpenAuthModal,
  ]);
  const getLockFeeAndSet = async (size = 0, onModalClose: () => void) => {
    try {
      const lockFeeInBNB = await getLockFee(size, spAddress);
      setLockFee(lockFeeInBNB.toString());
      setLockFeeLoading(false);
    } catch (error) {
      toast.error({
        description: GET_LOCK_FEE_ERROR,
      });
      onModalClose();
      setLockFeeLoading(false);
      setLockFee('-1');
      setGasFeeLoading(false);
      setGasFee('-1');
      // eslint-disable-next-line no-console
      console.error('Get lock fee error', error);
      return;
    }
  };

  const getCancelGasFeeAndSet = async (objectName: string, onModalClose: () => void) => {
    try {
      const { sequence } = await getAccount(GREENFIELD_CHAIN_RPC_URL, address);
      const cancelCteObjTx = new CancelCreateObjectTx(GREENFIELD_CHAIN_RPC_URL, String(chain?.id)!);
      const simulateBytes = cancelCteObjTx.getSimulateBytes({
        bucketName,
        objectName,
        from: address,
      });
      const authInfoBytes = cancelCteObjTx.getAuthInfoBytes({
        sequence: sequence.toString(),
        denom: 'BNB',
        gasLimit: 0,
        gasPrice: '0',
        pubKey: makeCosmsPubKey(ZERO_PUBKEY),
      });

      const simulateGas = await cancelCteObjTx.simulateTx(simulateBytes, authInfoBytes);
      setGasFeeLoading(false);
      setGasFee(getGasFeeBySimulate(simulateGas));
      setGasLimit(simulateGas.gasInfo?.gasUsed.toNumber() || 0);
      setGasPrice(simulateGas.gasInfo?.minGasPrice.replaceAll('BNB', '') || '0');
    } catch (error: any) {
      if (
        error.message.includes('lack of') ||
        error.message.includes('static balance is not enough')
      ) {
        // todo get the number of lacking money
        toast.error({
          description: GET_GAS_FEE_LACK_BALANCE_ERROR,
        });
      } else {
        toast.error({
          description: GET_GAS_FEE_DEFAULT_ERROR,
        });
      }
      onModalClose();
      setLockFeeLoading(false);
      setLockFee('-1');
      setGasFeeLoading(false);
      setGasFee('-1');
      // eslint-disable-next-line no-console
      console.error('Get gas fee error', error);
      return;
    }
  };

  const getDeleteGasFeeAndSet = async (objectName: string, onModalClose: () => void) => {
    try {
      const delObjTx = new DelObjectTx(GREENFIELD_CHAIN_RPC_URL, String(chain?.id)!);
      const { sequence } = await getAccount(GREENFIELD_CHAIN_RPC_URL!, address!);
      const simulateBytes = delObjTx.getSimulateBytes({
        bucketName,
        objectName,
        from: address,
      });
      const authInfoBytes = delObjTx.getAuthInfoBytes({
        sequence: sequence.toString(),
        denom: 'BNB',
        gasLimit: 0,
        gasPrice: '0',
        pubKey: makeCosmsPubKey(ZERO_PUBKEY),
      });
      const simulateGas = await delObjTx.simulateTx(simulateBytes, authInfoBytes);
      setGasFeeLoading(false);
      setGasFee(getGasFeeBySimulate(simulateGas));
      setGasLimit(simulateGas.gasInfo?.gasUsed.toNumber() || 0);
      setGasPrice(simulateGas.gasInfo?.minGasPrice.replaceAll('BNB', '') || '0');
    } catch (error: any) {
      if (
        error.message.includes('lack of') ||
        error.message.includes('static balance is not enough')
      ) {
        // todo get the number of lacking money
        toast.error({
          description: GET_GAS_FEE_LACK_BALANCE_ERROR,
        });
      } else {
        toast.error({
          description: GET_GAS_FEE_DEFAULT_ERROR,
        });
      }
      onModalClose();
      setLockFeeLoading(false);
      setLockFee('-1');
      setGasFeeLoading(false);
      setGasFee('-1');
      // eslint-disable-next-line no-console
      console.error('Get gas fee error', error);
      return;
    }
  };
  const renderVisibilityIcon = (showIcon = false, canView = true) => {
    if (!showIcon) return <></>;
    const renderIconByObjectStatus = () => {
      if (!canView) {
        return (
          <Flex className="canNotViewPublicIcon">
            <PublicFileIcon fillColor={'#AEB4BC'} />
          </Flex>
        );
      }
      return (
        <>
          <Flex className="originPublicFileIcon">
            <PublicFileIcon fillColor={'#1E2026'} />
          </Flex>
          <Flex className="hoverPublicFileIcon" style={{ display: 'none' }}>
            <PublicFileIcon fillColor={'#009E2C'} />
          </Flex>
        </>
      );
    };

    return (
      <Tooltip content={'Everyone can access.'} placement={'bottom-start'}>
        <Flex ml={'6px'} mt={'2px'}>
          {renderIconByObjectStatus()}
        </Flex>
      </Tooltip>
    );
  };
  const columns = useMemo<ColumnDef<any>[]>(() => {
    return [
      {
        accessorKey: 'object_name',
        header: 'Name',
        size: 360,
        cell: (info: any) => {
          const {
            row: { original: rowData },
          } = info;
          const isNormal = isSealed(rowData);
          const { visibility, object_status } = rowData;
          const canView = object_status === OBJECT_SEALED_STATUS;
          const showFileIcon = visibility === 1;
          const iconColor = isNormal ? 'inherit' : 'readable.disabled';
          return (
            <Flex
              className="object-name"
              data-disabled={!isNormal}
              alignItems={'center'}
              w="100%"
              position={'relative'}
              overflow={'hidden'}
            >
              <Flex mr={4}>
                <FileIcon size="md" color={iconColor} />
              </Flex>
              <TableText info={rowData} fontWeight={500}>
                {info.getValue()}
              </TableText>
              {renderVisibilityIcon(showFileIcon, canView)}
            </Flex>
          );
        },
      },
      {
        accessorKey: 'content_type',
        cell: (info: any) => {
          const {
            row: { original: rowData },
          } = info;
          return (
            <TableText info={rowData} color={'readable.normal'}>
              {contentTypeToExtension(rowData.content_type, rowData.object_name)}
            </TableText>
          );
        },

        header: 'Type',
        size: 120,
      },
      {
        accessorKey: 'payload_size',
        cell: (info: any) => {
          const {
            row: { original: rowData },
          } = info;
          const { payload_size, object_status, progress } = rowData;
          if (object_status === OBJECT_STATUS_FAILED || object_status === OBJECT_CREATE_STATUS) {
            return (
              <Flex
                display="inline-flex"
                bg={'rgba(238, 57, 17, 0.1)'}
                h={'24px'}
                borderRadius={'12px'}
                paddingX={'8px'}
                alignItems={'center'}
                justifyContent={'center'}
              >
                <Text lineHeight={'24px'} fontSize={'12px'} color="#EE3911" fontWeight={500}>
                  Upload Failed
                </Text>
              </Flex>
            );
          }
          if (object_status === OBJECT_STATUS_UPLOADING) {
            return <UploadProgress progress={progress} />;
          }
          return (
            <TableText info={rowData} color={'readable.normal'}>
              {formatBytes(payload_size as string)}
            </TableText>
          );
        },
        header: () => 'Size',
        size: 120,
      },
      {
        accessorKey: 'create_at',
        cell: (info: any) => {
          const {
            row: { original: rowData },
          } = info;
          const create_at = info.getValue();
          return (
            <TableText info={rowData} color={'readable.normal'}>
              {formatTime(getMillisecond(create_at as number)) as ReactNode}
            </TableText>
          );
        },
        header: () => 'Date Uploaded',
        size: 120,
      },
      {
        accessorKey: 'action',
        header: () => 'Action',
        size: 60,
        cell: (info: any) => {
          const {
            row: { original: rowData },
          } = info;
          // Get column property and values
          const objectName = (rowData.object_name as string) ?? '';
          const {
            payload_size: payloadSize,
            checksums,
            object_status: objectStatus,
            create_at,
            visibility,
          } = rowData;
          const isSealed = objectStatus === OBJECT_SEALED_STATUS;
          const isUploading = objectStatus === OBJECT_STATUS_UPLOADING;
          const isUploadFailed = objectStatus === OBJECT_STATUS_FAILED;
          const downloadText = 'Download';
          const deleteText = isSealed ? 'Delete' : 'Cancel';
          const showFileIcon = visibility === 1;
          const isCurrentUser = rowData.owner === address;
          if (isUploading || (!isCurrentUser && !isSealed)) return <></>;

          const onDownload = async (url?: string) => {
            try {
              // If we pass the download url, then we are obliged to directly download it rather than show a modal
              if (url && visibility === 1) {
                directlyDownload(url);
              } else {
                const { spAddresses, expirationTimestamp } = await getOffChainData(
                  loginState.address,
                );
                if (
                  !checkSpOffChainDataAvailable({ spAddresses, expirationTimestamp, spAddress })
                ) {
                  onStatusModalClose();
                  setOpenAuthModal();
                  return;
                }
                // setStatusModalIcon(FILE_DOWNLOAD_URL);
                // setStatusModalTitle(FILE_TITLE_DOWNLOADING);
                // setStatusModalErrorText('');
                // setStatusModalDescription(FILE_STATUS_DOWNLOADING);
                // setStatusModalButtonText('');
                // onStatusModalOpen();
                // await downloadFile({ bucketName, objectName, endpoint });
                const result = await downloadWithProgress(
                  bucketName,
                  objectName,
                  endpoint,
                  Number(payloadSize),
                  loginState.address,
                );
                saveFileByAxiosResponse(result, objectName);
                // onStatusModalClose();
              }
            } catch (error: any) {
              if (error?.response?.status === 500) {
                onStatusModalClose();
                setOpenAuthModal();
              } else {
                setStatusModalIcon(FILE_EMPTY_URL);
                setStatusModalTitle(FILE_TITLE_DOWNLOADING);
                setStatusModalErrorText('Error message: ' + error?.message ?? '');
                setStatusModalDescription(FILE_TITLE_DOWNLOAD_FAILED);
                setStatusModalButtonText('');
                onStatusModalOpen();
              }
            }
          };

          const downloadWithConfirm = async (url: string) => {
            if (allowDirectDownload) {
              try {
                const quotaData = await getQuota(bucketName, endpoint);
                if (quotaData) {
                  const { freeQuota, readQuota, consumedQuota } = quotaData;
                  const currentRemainingQuota = readQuota + freeQuota - consumedQuota;
                  const isAbleDownload = !(
                    currentRemainingQuota && currentRemainingQuota - Number(payloadSize) < 0
                  );
                  if (!isAbleDownload) {
                    setStatusModalIcon(NOT_ENOUGH_QUOTA_URL);
                    setStatusModalTitle(NOT_ENOUGH_QUOTA);
                    setStatusModalErrorText('');
                    setStatusModalDescription(NOT_ENOUGH_QUOTA_ERROR);
                    setStatusModalButtonText(BUTTON_GOT_IT);
                    onStatusModalOpen();
                    return;
                  }
                }
                await onDownload(url);
              } catch (error) {
                console.error('Get quota error', error);
                // don't block download if quota service met issues
                await onDownload(url);
              }
            } else {
              setFileInfo({ name: objectName, size: payloadSize });
              setShareLink(url);
              setCurrentVisibility(visibility);
              onConfirmDownloadModalOpen();
              setRemainingQuota(null);
              const quotaData = await getQuota(bucketName, endpoint);
              if (quotaData) {
                const { freeQuota, readQuota, consumedQuota } = quotaData;
                setRemainingQuota(readQuota + freeQuota - consumedQuota);
              }
            }
          };

          const onShare = () => {
            setShareLink(directDownloadLink);
            onShareModalOpen();
          };

          const directDownloadLink = encodeURI(`${endpoint}/download/${bucketName}/${objectName}`);
          return (
            <Flex position="relative" gap={4} justifyContent="flex-end" alignItems={'center'}>
              {isSealed && isCurrentUser && showFileIcon && (
                <ActionButton gaClickName="dc.file.share_btn.0.click" onClick={onShare}>
                  <ShareIcon />
                </ActionButton>
              )}

              {isSealed && (
                <ActionButton
                  gaClickName="dc.file.download_btn.0.click"
                  onClick={() => {
                    downloadWithConfirm(directDownloadLink);
                  }}
                >
                  <DownloadIcon size="md" color="readable.brand6" />
                </ActionButton>
              )}
              <Menu offset={[-12, 0]} placement="bottom-start" strategy="fixed" trigger="hover">
                {({ isOpen }) => (
                  <>
                    <GAClick name="dc.file.detail_btn.0.click">
                      <MenuButton
                        boxSize={24}
                        display={'flex'}
                        justifyContent={'center'}
                        alignItems={'center'}
                        as="div"
                        cursor="pointer"
                        onClick={(e) => e.stopPropagation()}
                        bgColor={isOpen ? 'rgba(0, 186, 52, 0.1)' : 'transparent'}
                        color={isOpen ? 'readable.brand6' : 'readable.normal'}
                        borderRadius={18}
                        transitionProperty="colors"
                        transitionDuration="normal"
                        _hover={{
                          bgColor: 'rgba(0, 186, 52, 0.2)',
                          color: 'readable.brand6',
                        }}
                      >
                        <MenuIcon size="md" />
                      </MenuButton>
                    </GAClick>
                    <MenuList w={'120px'}>
                      <GAShow name="dc.file.list_menu.0.show" isShow={isOpen} />
                      {isSealed && isCurrentUser && (
                        <GreenfieldMenuItem
                          gaClickName="dc.file.list_menu.detail.click"
                          onClick={async (e: React.MouseEvent) => {
                            e.stopPropagation();
                            setRemainingQuota(null);
                            setFileInfo({ name: objectName, size: payloadSize });
                            setHash(checksums?.[0] ?? '');
                            setCreatedDate(create_at);
                            setShareLink(directDownloadLink);
                            setCurrentVisibility(visibility);
                            onInfoModalOpen();
                            const quotaData = await getQuota(bucketName, endpoint);
                            if (quotaData) {
                              const { freeQuota, readQuota, consumedQuota } = quotaData;
                              setRemainingQuota(readQuota + freeQuota - consumedQuota);
                            }
                          }}
                        >
                          View Details
                        </GreenfieldMenuItem>
                      )}
                      {isSealed && (
                        <GreenfieldMenuItem
                          gaClickName="dc.file.list_menu.download.click"
                          onClick={() => {
                            downloadWithConfirm(directDownloadLink);
                          }}
                        >
                          {downloadText}
                        </GreenfieldMenuItem>
                      )}
                      {isSealed && isCurrentUser && showFileIcon && (
                        <GreenfieldMenuItem
                          gaClickName="dc.file.list_menu.share.click"
                          onClick={onShare}
                        >
                          Share
                        </GreenfieldMenuItem>
                      )}
                      {isUploadFailed && isCurrentUser && (
                        <GreenfieldMenuItem
                          gaClickName="dc.file.list_menu.cancel.click"
                          onClick={async (e: React.MouseEvent) => {
                            e.stopPropagation();

                            setFileInfo({ name: objectName, size: payloadSize });
                            // calculate gas fee
                            try {
                              setGasFeeLoading(true);
                              setGasFee('-1');
                              setLockFeeLoading(true);
                              setLockFee('-1');
                              setLockFeeLoading(false);
                              onConfirmCancelModalOpen();
                              getCancelGasFeeAndSet(objectName, onConfirmCancelModalClose);
                            } catch (error) {
                              setGasFeeLoading(false);
                              toast.error({
                                description: 'Get gas fee error',
                              });
                              onConfirmCancelModalClose();
                              // eslint-disable-next-line no-console
                              console.error('get gas fee error', error);
                            }
                          }}
                        >
                          Cancel
                        </GreenfieldMenuItem>
                      )}
                      {isCurrentUser && !isUploadFailed && (
                        <GreenfieldMenuItem
                          gaClickName={
                            isSealed
                              ? 'dc.file.list_menu.delete.click'
                              : 'dc.file.list_menu.cancel.click'
                          }
                          onClick={async (e: React.MouseEvent) => {
                            e.stopPropagation();
                            setFileInfo({ name: objectName, size: payloadSize });
                            // calculate gas fee
                            try {
                              setGasFeeLoading(true);
                              setGasFee('-1');
                              setLockFeeLoading(true);
                              setLockFee('-1');
                              if (isSealed) {
                                // delete object if sealed
                                onConfirmDeleteModalOpen();
                                getDeleteGasFeeAndSet(objectName, onConfirmDeleteModalClose);
                                getLockFeeAndSet(payloadSize, onConfirmDeleteModalClose);
                              } else {
                                // cancel object if unsealed
                                // setLockFeeLoading(false);
                                onConfirmCancelModalOpen();
                                getCancelGasFeeAndSet(objectName, onConfirmCancelModalClose);
                                getLockFeeAndSet(payloadSize, onConfirmCancelModalClose);
                              }
                            } catch (error) {
                              setGasFeeLoading(false);
                              toast.error({
                                description: 'Get gas fee error',
                              });
                              if (isSealed) {
                                onConfirmDeleteModalClose();
                              } else {
                                onConfirmCancelModalClose();
                              }
                              // eslint-disable-next-line no-console
                              console.error('Get gas fee error', error);
                            }
                          }}
                        >
                          {deleteText}
                        </GreenfieldMenuItem>
                      )}
                    </MenuList>
                  </>
                )}
              </Menu>
            </Flex>
          );
        },
      },
    ];
  }, [
    spAddress,
    chain,
    address,
    endpoint,
    bucketName,
    allowDirectDownload,
    setCloseAllAndShowAuthModal,
  ]);
  const loadingColumns = columns.map((column) => ({
    ...column,
    cell: <SkeletonSquare style={{ width: '80%' }} />,
  }));
  const finalColumns = isLoading ? loadingColumns : columns;
  const table = useReactTable({
    data: finalData,
    // @ts-ignore
    columns: finalColumns,
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: false,
  });

  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtual({
    parentRef: tableContainerRef,
    size: rows.length,
    overscan: 30,
  });
  const { virtualItems: virtualRows, totalSize } = rowVirtualizer;
  const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0) : 0;

  const tableNotFullHeight = finalData?.length * 56 + 45;

  return (
    <>
      <Box width={containerWidth} minW="">
        <Box
          className="container"
          borderRadius={'16px'}
          height={tableNotFullHeight < tableFullHeight ? tableNotFullHeight : tableFullHeight}
          paddingX="16px"
          border="none"
          backgroundColor={'#fff'}
          ref={tableContainerRef}
        >
          <Box
            as="table"
            sx={{
              tableLayout: 'fixed',
              width: '100%',
              th: {
                h: 44,
                fontWeight: 600,
                fontSize: 12,
                lineHeight: '18px',
                color: 'readable.tertiary',
              },
              'td, th': {
                px: 16,
                _last: {
                  textAlign: 'right',
                },
              },
              'tbody > tr:last-child': {
                borderBottom: 'none',
              },
            }}
          >
            <Box
              as="thead"
              position={'sticky'}
              zIndex={1}
              margin="0"
              top="0"
              backgroundColor={'#fff'}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <Box as="tr" key={headerGroup.id} borderBottom="1px solid #E6E8EA">
                  {headerGroup.headers.map((header) => {
                    return (
                      <Box
                        as="th"
                        key={header.id}
                        colSpan={header.colSpan}
                        width={header.getSize()}
                        textAlign="left"
                        height={'44px'}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
            <Box as="tbody">
              {paddingTop > 0 && (
                <Box as="tr">
                  <td style={{ height: `${paddingTop}px` }} />
                </Box>
              )}
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index] as Row<any>;

                const { object_status, visibility, object_name, payload_size } = row.original;
                const canView = object_status === OBJECT_SEALED_STATUS;

                return (
                  <GAClick key={row.id} name="dc.file.list.file_item.click">
                    <Box
                      as="tr"
                      key={row.id}
                      color="readable.normal"
                      cursor={canView ? 'pointer' : undefined}
                      _hover={{
                        backgroundColor: isLoading ? 'transparent' : 'rgba(0, 186, 52, 0.1)',
                        color: 'readable.brand7',
                        '.btn-action': {
                          visibility: 'visible',
                        },
                        '.originPublicFileIcon': {
                          display: 'none',
                        },
                        '.hoverPublicFileIcon': {
                          display: 'flex!important',
                        },
                      }}
                      borderBottom="1px solid #E6E8EA"
                      onClick={async () => {
                        if (!canView) return;
                        const previewLink = encodeURI(
                          `${endpoint}/view/${bucketName}/${object_name}`,
                        );
                        if (!allowDirectView) {
                          setFileInfo({ name: object_name, size: payload_size });
                          setViewLink(previewLink);
                          setCurrentVisibility(visibility);
                          onConfirmViewModalOpen();
                          setRemainingQuota(null);
                          const quotaData = await getQuota(bucketName, endpoint);
                          if (quotaData) {
                            const { freeQuota, readQuota, consumedQuota } = quotaData;
                            setRemainingQuota(readQuota + freeQuota - consumedQuota);
                          }
                          return;
                        }
                        if (visibility === 1) {
                          window.open(previewLink, '_blank');
                        } else {
                          // preview file
                          try {
                            const { spAddresses, expirationTimestamp } = await getOffChainData(
                              loginState.address,
                            );
                            if (
                              !checkSpOffChainDataAvailable({
                                spAddresses,
                                expirationTimestamp,
                                spAddress,
                              })
                            ) {
                              setOpenAuthModal();
                              return;
                            }
                            const result = await downloadWithProgress(
                              bucketName,
                              object_name,
                              endpoint,
                              Number(payload_size),
                              loginState.address,
                            );
                            viewFileByAxiosResponse(result);
                          } catch (error: any) {
                            if (error?.response?.status === 500) {
                              setOpenAuthModal();
                            }
                            throw new Error(error);
                          }
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => {
                        return (
                          <Box as="td" height={'56px'} key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Box>
                        );
                      })}
                    </Box>
                  </GAClick>
                );
              })}
              {paddingBottom > 0 && (
                <Box as="tr">
                  <td style={{ height: `${paddingBottom}px` }} />
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
      <FileInfoModal
        onClose={onInfoModalClose}
        isOpen={isInfoModalOpen}
        bucketName={bucketName}
        fileInfo={fileInfo}
        hash={hash}
        shareLink={shareLink}
        createdDate={createdDate}
        primarySpUrl={endpoint}
        visibility={currentVisibility}
        spAddress={spAddress}
        primarySpAddress={spAddress}
        primarySpSealAddress={primarySpSealAddress}
        onShareModalOpen={onShareModalOpen}
        remainingQuota={remainingQuota}
        setStatusModalIcon={setStatusModalIcon}
        setStatusModalTitle={setStatusModalTitle}
        setStatusModalDescription={setStatusModalDescription}
        onStatusModalOpen={onStatusModalOpen}
        onStatusModalClose={onStatusModalClose}
        setStatusModalErrorText={setStatusModalErrorText}
        setStatusModalButtonText={setStatusModalButtonText}
        onConfirmDownloadModalOpen={onConfirmDownloadModalOpen}
      />
      <ConfirmDownloadModal
        onClose={onConfirmDownloadModalClose}
        isOpen={isConfirmDownloadModalOpen}
        bucketName={bucketName}
        fileInfo={fileInfo}
        endpoint={endpoint}
        spAddress={spAddress}
        visibility={currentVisibility}
        setStatusModalIcon={setStatusModalIcon}
        setStatusModalTitle={setStatusModalTitle}
        setStatusModalDescription={setStatusModalDescription}
        onStatusModalOpen={onStatusModalOpen}
        onStatusModalClose={onStatusModalClose}
        setStatusModalErrorText={setStatusModalErrorText}
        setStatusModalButtonText={setStatusModalButtonText}
        shareLink={shareLink}
        remainingQuota={remainingQuota}
      />
      <ConfirmViewModal
        onClose={onConfirmViewModalClose}
        isOpen={isConfirmViewModalOpen}
        bucketName={bucketName}
        fileInfo={fileInfo}
        endpoint={endpoint}
        spAddress={spAddress}
        viewLink={viewLink}
        visibility={currentVisibility}
        setStatusModalIcon={setStatusModalIcon}
        setStatusModalTitle={setStatusModalTitle}
        setStatusModalDescription={setStatusModalDescription}
        onStatusModalOpen={onStatusModalOpen}
        onStatusModalClose={onStatusModalClose}
        setStatusModalErrorText={setStatusModalErrorText}
        setStatusModalButtonText={setStatusModalButtonText}
        remainingQuota={remainingQuota}
      />
      <ConfirmDeleteModal
        onClose={onConfirmDeleteModalClose}
        isOpen={isConfirmDeleteModalOpen}
        bucketName={bucketName}
        fileInfo={fileInfo}
        endpoint={endpoint}
        simulateGasFee={gasFee}
        gasLimit={gasLimit}
        gasPrice={gasPrice}
        listObjects={listObjects}
        setListObjects={setListObjects}
        outsideLoading={gasFeeLoading || lockFeeLoading}
        setStatusModalIcon={setStatusModalIcon}
        setStatusModalTitle={setStatusModalTitle}
        setStatusModalDescription={setStatusModalDescription}
        onStatusModalOpen={onStatusModalOpen}
        onStatusModalClose={onStatusModalClose}
        setStatusModalErrorText={setStatusModalErrorText}
        setStatusModalButtonText={setStatusModalButtonText}
        lockFee={lockFee}
      />
      <ConfirmCancelModal
        onClose={onConfirmCancelModalClose}
        isOpen={isConfirmCancelModalOpen}
        bucketName={bucketName}
        fileInfo={fileInfo}
        endpoint={endpoint}
        simulateGasFee={gasFee}
        gasLimit={gasLimit}
        lockFee={lockFee}
        gasPrice={gasPrice}
        outsideLoading={gasFeeLoading}
        listObjects={listObjects}
        setListObjects={setListObjects}
        setStatusModalIcon={setStatusModalIcon}
        setStatusModalTitle={setStatusModalTitle}
        setStatusModalDescription={setStatusModalDescription}
        onStatusModalOpen={onStatusModalOpen}
        onStatusModalClose={onStatusModalClose}
        setStatusModalErrorText={setStatusModalErrorText}
        setStatusModalButtonText={setStatusModalButtonText}
      />
      <ShareModal isOpen={isShareModalOpen} onClose={onShareModalClose} shareLink={shareLink} />
    </>
  );
};
