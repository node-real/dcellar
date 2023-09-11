import { Flex, Link, toast } from '@totejs/uikit';
import { getNumInDigits } from '@/utils/wallet';
import {
  CRYPTOCURRENCY_DISPLAY_PRECISION,
  FIAT_CURRENCY_DISPLAY_PRECISION,
} from '@/modules/wallet/constants';
import { InternalRoutePaths } from '@/constants/paths';
import { AxiosResponse } from 'axios';
import React, { memo, useEffect, useState } from 'react';
import { GAClick, GAShow } from '@/components/common/GATracker';
import { getClient } from '@/base/client';
import { ChainVisibilityEnum } from '../type';
import { SpItem } from '@/store/slices/sp';
import { BN } from '@/utils/BigNumber';
import { useMount } from 'ahooks';

const formatBytes = (bytes: number | string, isFloor = false) => {
  if (typeof bytes === 'string') {
    bytes = parseInt(bytes);
  }
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1048576) {
    return getNumInDigits(bytes / 1024, 1, false, isFloor) + ' KB';
  } else if (bytes < 1073741824) {
    return getNumInDigits(bytes / 1048576, 1, false, isFloor) + ' MB';
  } else if (bytes < 1099511627776) {
    return getNumInDigits(bytes / 1073741824, 1, false, isFloor) + ' GB';
  } else {
    return getNumInDigits(bytes / 1099511627776, 1, false, isFloor) + ' TB';
  }
};

const getObjectInfo = async (bucketName: string, objectName: string) => {
  const client = await getClient();
  return await client.object.headObject(bucketName, objectName);
};

const renderFeeValue = (bnbValue: string, exchangeRate: number | string) => {
  // loading status
  // todo add error status maybe?
  if (!bnbValue || Number(bnbValue) < 0 || isNaN(Number(bnbValue))) {
    return '--';
  }

  return `${renderBnb(bnbValue)} BNB (${renderUsd(bnbValue, exchangeRate)})`;
};
const renderPrelockedFeeValue = (bnbValue: string, exchangeRate: number | string) => {
  // loading status
  // todo add error status maybe?
  if (!bnbValue || Number(bnbValue) < 0) {
    return '--';
  }
  if (Number(bnbValue) === 0) {
    return '0 BNB ($0.00)';
  }

  const bnbNum = renderBnb(bnbValue);
  const renderBnbvalue =
    Number(getNumInDigits(bnbNum, 8, true)) === 0 ? `≈${getNumInDigits(0, 8, true)}` : bnbNum;

  return `${renderBnbvalue} BNB (${renderUsd(bnbValue, exchangeRate)})`;
};
const renderUsd = (bnbValue: string, exchangeRate: number | string) => {
  const numberInUsd = Number(bnbValue ?? 0) * Number(exchangeRate);
  return `$${getNumInDigits(numberInUsd, FIAT_CURRENCY_DISPLAY_PRECISION, true)}`;
};

const renderBnb = (bnbValue: string) => {
  return `${getNumInDigits(bnbValue, CRYPTOCURRENCY_DISPLAY_PRECISION)}`;
};

const getFileExtension = (filename: string): string | undefined => {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex > 0 && dotIndex < filename.length - 1) {
    return filename.substring(dotIndex + 1).toUpperCase();
  } else {
    return '';
  }
};

const downloadWithProgress = async ({
  bucketName,
  objectName,
  primarySp,
  payloadSize,
  address,
  seedString,
}: {
  bucketName: string;
  objectName: string;
  primarySp: SpItem;
  payloadSize: number;
  address: string;
  seedString: string;
}) => {
  // deprecated
  throw 'Deprecated methods';
};
const getBuiltInLink = (
  primarySp: string,
  bucketName: string,
  fileName: string,
  type: 'download' | 'view',
) => {
  return `${primarySp}/${type}/${bucketName}/${fileName}`;
};

const contentTypeToExtension = (contentType = '', fileName?: string) => {
  if (fileName?.endsWith('/')) return 'FOLDER';
  switch (contentType) {
    case 'image/jpeg':
      return 'JPG';
    case 'image/png':
      return 'PNG';
    case 'image/gif':
      return 'GIF';
    case 'application/pdf':
      return 'PDF';
    case 'application/msword':
      return 'DOC';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'DOCX';
    case 'application/vnd.ms-excel':
      return 'XLS';
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return 'XLSX';
    case 'text/plain':
      return 'TXT';
    case 'application/zip':
      return 'ZIP';
    case 'application/octet-stream':
      return 'Document';
    default:
      if (fileName && fileName.length > 0) {
        const fileExtension = getFileExtension(fileName);
        return fileExtension ? fileExtension : contentType;
      }
      return contentType;
  }
};
const contentIconTypeToExtension = (fileName: string) => {
  if (fileName?.endsWith('/')) return 'FOLDER';
  const type = getFileExtension(fileName)?.split('-')[0].toLocaleLowerCase();
  switch (type) {
    case 'doc':
    case 'docx':
    case 'odt':
      return 'DOC';
    case 'xls':
    case 'xlsx':
    case 'csv':
    case 'gsheet':
    case 'numbers':
    case 'ods':
      return 'SHEET';
    case 'pptx':
    case 'ppsx':
    case 'odp':
      return 'SLIDE';
    case 'pdf':
      return 'PDF';
    case 'jpeg':
    case 'jpg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'tiff':
      return 'IMAGE';
    case 'mp3':
    case 'wav':
    case 'aac':
    case 'flac':
    case 'wma':
    case 'alac':
    case 'aiff':
      return 'MUSIC';
    case 'avi':
    case 'mp4':
    case 'mov':
    case 'mkv':
    case 'wmv':
    case 'webm':
      return 'VIDEO';
    case 'c':
    case 'cpp':
    case 'py':
    case 'java':
    case 'js':
    case 'html':
    case 'css':
    case 'php':
    case 'rb':
      return 'CODE';
    case 'zip':
    case 'rar':
    case '7z':
      return 'ZIP';
    default:
      return 'OTHERS';
  }
};

const renderBalanceNumber = (availableBalance: string) => {
  if (Number(availableBalance) < 0) return 'Fetching balance...';
  return `${getNumInDigits(availableBalance, CRYPTOCURRENCY_DISPLAY_PRECISION)} BNB`;
};

// bankBalance + gasFee, 校验余额够不够，
// storeFee + payment account，校验payment balance够不够
const renderInsufficientBalance = (
  simulateGasFee: string,
  lockFee: string,
  availableBalance: string,
  gaOptions?: { gaClickName: string; gaShowName: string },
) => {
  if (!simulateGasFee || Number(simulateGasFee) < 0 || !lockFee || Number(lockFee) < 0)
    return <></>;
  const currentBalance = Number(availableBalance);
  if (currentBalance >= Number(simulateGasFee) + Number(lockFee)) return <></>;
  return (
    <GAShow name={gaOptions?.gaShowName}>
      Insufficient balance.&nbsp;
      <GAClick name={gaOptions?.gaClickName}>
        <Link
          href={InternalRoutePaths.transfer_in}
          style={{ textDecoration: 'underline' }}
          color="#EE3911"
        >
          Transfer in
        </Link>
      </GAClick>
    </GAShow>
  );
};

const directlyDownload = (url: string, target = '_self', name?: string) => {
  if (!url) {
    toast.error({
      description: 'Download url not existed. Please check.',
    });
  }
  const link = document.createElement('a');
  link.href = url;
  link.download = name || '';
  link.target = target;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const batchDownload = (url: string | string[]) => {
  const urls = Array<string>().concat(url);
  urls.forEach((url) => {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  });
};

const transformVisibility = (visibility: ChainVisibilityEnum) => {
  switch (visibility) {
    case ChainVisibilityEnum.VISIBILITY_TYPE_UNSPECIFIED:
      return 'Unspecified';

    case ChainVisibilityEnum.VISIBILITY_TYPE_PUBLIC_READ:
      return 'Public';

    case ChainVisibilityEnum.VISIBILITY_TYPE_PRIVATE:
      return 'Private';

    case ChainVisibilityEnum.VISIBILITY_TYPE_INHERIT:
      return 'Inherit';

    case ChainVisibilityEnum.UNRECOGNIZED:
    default:
      return 'Unrecognized';
  }
};

const viewFileByAxiosResponse = (result: AxiosResponse) => {
  try {
    const { data, headers: resultHeaders } = result;
    const blob = new Blob([data], { type: resultHeaders['content-type'] });
    const fileURL = URL.createObjectURL(blob);
    window.open(fileURL, '_blank');
  } catch (error) {
    console.error('view file error', error);
  }
};

const saveFileByAxiosResponse = (result: AxiosResponse, objectName: string) => {
  try {
    const { data, headers: resultHeaders } = result;
    const blob = new Blob([data], { type: resultHeaders['content-type'] });
    const fileURL = URL.createObjectURL(blob);
    const fileLink = document.createElement('a');
    fileLink.href = fileURL;
    fileLink.download = objectName as string;
    fileLink.click();
  } catch (error) {
    console.error('save file error', error);
  }
};

const truncateFileName = (fileName: string) => {
  if (!fileName || fileName.length === 0) return '';
  const maxFileNameLength = 25;
  const fileExtension = fileName.slice(fileName.lastIndexOf('.'));
  const fileNameWithoutExtension = fileName.slice(0, fileName.lastIndexOf('.'));
  const truncatedFileNameLength = maxFileNameLength - fileExtension.length - 4;
  if (fileName.length <= maxFileNameLength) {
    return fileName;
  }
  return `${fileNameWithoutExtension.slice(
    0,
    truncatedFileNameLength,
  )}...${fileNameWithoutExtension.slice(-4)}${fileExtension}`;
};

interface PaymentInsufficientBalanceProps {
  gasFee: string | number;
  storeFee: string;
  settlementFee: string;
  refundFee: string;
  payGasFeeBalance: string;
  payStoreFeeBalance: string;
  ownerAccount: string;
  payAccount: string;
  gaOptions?: { gaClickName: string; gaShowName: string };
  onValidate: (val: boolean) => void;
}

export const PaymentInsufficientBalance = memo<PaymentInsufficientBalanceProps>(
  function PaymentInsufficientBalance(props) {
    const {
      gasFee,
      storeFee,
      settlementFee,
      // This field have value when Cancel object or delete object
      refundFee,
      payGasFeeBalance,
      payStoreFeeBalance,
      ownerAccount,
      payAccount,
      gaOptions,
      onValidate,
    } = props;
    const [items, setItems] = useState<Array<{ link: string; text: string }>>([]);
    const isOwnerAccount = ownerAccount === payAccount;

    useMount(() => {
      onValidate(true);
    });

    useEffect(() => {
      onValidate(!items.length);
    }, [items.length]);

    useEffect(() => {
      if (!gasFee || Number(gasFee) < 0) {
        setItems([]);
        return;
      }
      const items = [];
      if (isOwnerAccount) {
        // If is owner account, bankBalance can pay store fee.
        if (
          BN(payGasFeeBalance).lt(BN(gasFee)) ||
          BN(BN(payGasFeeBalance).plus(payStoreFeeBalance)).lt(
            BN(gasFee).plus(storeFee).plus(settlementFee).minus(refundFee),
          )
        ) {
          items.push({
            link: InternalRoutePaths.transfer_in,
            text: 'Transfer In',
          });
        }
      } else {
        if (BN(payGasFeeBalance).lt(BN(gasFee))) {
          items.push({
            link: InternalRoutePaths.transfer_in,
            text: 'Transfer In',
          });
        }
        if (BN(payStoreFeeBalance).lt(BN(storeFee).plus(settlementFee).minus(refundFee))) {
          const link = `${InternalRoutePaths.send}&from=${ownerAccount}&to=${payAccount}`;
          items.push({
            link: link,
            text: 'Deposit',
          });
        }
      }
      setItems(items);
    }, [props]);

    if (items.length === 0) return <></>;

    return (
      <Flex color={'#EE3911'}>
        {items.map((item, index) => (
          <GAShow key={index} name={gaOptions?.gaShowName}>
            Insufficient balance.&nbsp;
            <GAClick name={gaOptions?.gaClickName}>
              <Link
                display={'inline'}
                href={item.link}
                style={{ textDecoration: 'underline' }}
                color="#EE3911"
                _hover={{ color: '#EE3911' }}
              >
                {item.text}
              </Link>
            </GAClick>
          </GAShow>
        ))}
      </Flex>
    );
  },
);

const renderPaymentInsufficientBalance = ({
  gasFee,
  storeFee,
  settlementFee,
  // This field have value when Cancel object or delete object
  refundFee,
  payGasFeeBalance,
  payStoreFeeBalance,
  ownerAccount,
  payAccount,
  gaOptions,
}: {
  gasFee: string | number;
  storeFee: string;
  settlementFee: string;
  refundFee: string;
  payGasFeeBalance: string;
  payStoreFeeBalance: string;
  ownerAccount: string;
  payAccount: string;
  gaOptions?: { gaClickName: string; gaShowName: string };
}) => {
  if (!gasFee || Number(gasFee) < 0) return <></>;
  const items = [];
  const isOwnerAccount = ownerAccount === payAccount;
  if (isOwnerAccount) {
    // If is owner account, bankBalance can pay store fee.
    if (
      BN(payGasFeeBalance).lt(BN(gasFee)) ||
      BN(BN(payGasFeeBalance).plus(payStoreFeeBalance)).lt(
        BN(gasFee).plus(storeFee).plus(settlementFee).minus(refundFee),
      )
    ) {
      items.push({
        link: InternalRoutePaths.transfer_in,
        text: 'Transfer In',
      });
    }
  } else {
    if (BN(payGasFeeBalance).lt(BN(gasFee))) {
      items.push({
        link: InternalRoutePaths.transfer_in,
        text: 'Transfer In',
      });
    }
    if (BN(payStoreFeeBalance).lt(BN(storeFee).plus(settlementFee).minus(refundFee))) {
      const link = `${InternalRoutePaths.send}&from=${ownerAccount}&to=${payAccount}`;
      items.push({
        link: link,
        text: 'Deposit',
      });
    }
  }
  if (items.length === 0) return <></>;

  return (
    <Flex color={'#EE3911'}>
      {items.map((item, index) => (
        <GAShow key={index} name={gaOptions?.gaShowName}>
          Insufficient balance.&nbsp;
          <GAClick name={gaOptions?.gaClickName}>
            <Link
              display={'inline'}
              href={item.link}
              style={{ textDecoration: 'underline' }}
              color="#EE3911"
              _hover={{ color: '#EE3911' }}
            >
              {item.text}
            </Link>
          </GAClick>
        </GAShow>
      ))}
    </Flex>
  );
};
export {
  formatBytes,
  getObjectInfo,
  renderFeeValue,
  renderUsd,
  renderBnb,
  contentTypeToExtension,
  contentIconTypeToExtension,
  renderBalanceNumber,
  renderInsufficientBalance,
  directlyDownload,
  transformVisibility,
  downloadWithProgress,
  viewFileByAxiosResponse,
  saveFileByAxiosResponse,
  truncateFileName,
  renderPrelockedFeeValue,
  getBuiltInLink,
  renderPaymentInsufficientBalance,
};
