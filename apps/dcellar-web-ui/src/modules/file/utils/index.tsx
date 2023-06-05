import Link from 'next/link';
import { toast } from '@totejs/uikit';
import { getNumInDigits } from '@/utils/wallet';
import {
  CRYPTOCURRENCY_DISPLAY_PRECISION,
  FIAT_CURRENCY_DISPLAY_PRECISION,
} from '@/modules/wallet/constants';
import { InternalRoutePaths } from '@/constants/links';
import axios, { AxiosResponse } from 'axios';
import React from 'react';
import ProgressBarToast from '@/modules/file/components/ProgressBarToast';
import { GAClick, GAShow } from '@/components/common/GATracker';
import { getDomain } from '@/utils/getDomain';
import { getOffChainData } from '@/modules/off-chain-auth/utils';
import { client } from '@/base/client';
import { generateGetObjectOptions } from './generateGetObjectOptions';
import { VisibilityType } from '../constant';

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
  return await client.object.headObject(bucketName, objectName);
};

const renderFeeValue = (bnbValue: string, exchangeRate: number) => {
  // loading status
  // todo add error status maybe?
  if (!bnbValue || Number(bnbValue) < 0) {
    return '--';
  }
  return `${renderBnb(bnbValue)} BNB (${renderUsd(bnbValue, exchangeRate)})`;
};
const renderPrelockedFeeValue = (bnbValue: string, exchangeRate: number) => {
  // loading status
  // todo add error status maybe?
  if (!bnbValue || Number(bnbValue) < 0) {
    return '--';
  }
  const numberInUsd = Number(bnbValue ?? 0) * exchangeRate;
  const renderUsdValue =
    getNumInDigits(numberInUsd, 8, true) === 0
      ? `≈${renderUsd(bnbValue, exchangeRate)}`
      : renderUsd(bnbValue, exchangeRate);

  return `${renderBnb(bnbValue)} BNB (${renderUsdValue})`;
};
const renderUsd = (bnbValue: string, exchangeRate: number) => {
  const numberInUsd = Number(bnbValue ?? 0) * exchangeRate;
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

const downloadWithProgress = async (
  bucketName: string,
  objectName: string,
  endpoint: string,
  payloadSize: number,
  userAddress: string,
) => {
  try {
    const domain = getDomain();
    const { seedString, expirationTime, spAddresses } = await getOffChainData(userAddress);
    const uploadOptions = await generateGetObjectOptions({
      bucketName,
      objectName,
      endpoint,
      userAddress,
      domain,
      seedString,
    });
    const { url, headers } = uploadOptions;
    const toastId = toast.info({
      description: ``,
      render: () => {
        return (
          <ProgressBarToast
            progress={0}
            fileName={objectName}
            closeToast={() => {
              toast.close(toastId);
            }}
          />
        );
      },
      duration: -1,
    });
    const result = await axios
      .get(url, {
        onDownloadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / payloadSize) * 100);
          toast.update(toastId, {
            description: ``,
            render: () => {
              return (
                <ProgressBarToast
                  progress={progress}
                  fileName={objectName}
                  closeToast={() => {
                    toast.close(toastId);
                  }}
                />
              );
            },
          });
        },
        headers: {
          Authorization: headers.get('Authorization'),
          'X-Gnfd-User-Address': headers.get('X-Gnfd-User-Address'),
          'X-Gnfd-App-Domain': headers.get('X-Gnfd-App-Domain'),
        },
        responseType: 'blob',
      })
      .catch((e) => {
        toast.close(toastId);
        throw e;
      });
    toast.close(toastId);
    return result;
  } catch (error: any) {
    throw error;
  }
};

const contentTypeToExtension = (contentType = '', fileName?: string) => {
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

const renderBalanceNumber = (availableBalance: string) => {
  if (Number(availableBalance) < 0) return 'Fetching balance...';
  return `${getNumInDigits(availableBalance, CRYPTOCURRENCY_DISPLAY_PRECISION)} BNB`;
};

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

const directlyDownload = (url: string) => {
  if (!url) {
    toast.error({
      description: 'Download url not existed. Please check.',
    });
  }
  const link = document.createElement('a');
  link.href = url;
  link.download = '';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getQuota = async (
  bucketName: string,
  endpoint: string,
): Promise<{ freeQuota: number; readQuota: number; consumedQuota: number } | null> => {
  try {
    const { code, body } = await client.bucket.getBucketReadQuota({
      bucketName,
      endpoint,
    });
    if (code !== 0 || !body) {
      toast.error({
        description: 'Get bucket read quota met error.',
      });
      console.error(`Get bucket read quota met error. Error code: ${code}`);
      return null;
    }
    const { freeQuota, readQuota, consumedQuota } = body;
    return {
      freeQuota,
      readQuota,
      consumedQuota,
    };
  } catch (error) {
    toast.error({
      description: 'Get bucket read quota met error.',
    });
    // eslint-disable-next-line no-console
    console.error('get bucket read quota error', error);
    return null;
  }
};

const transformVisibility = (visibility: string) => {
  switch (visibility) {
    case VisibilityType.VISIBILITY_TYPE_UNSPECIFIED:
      return 'Unspecified';

    case VisibilityType.VISIBILITY_TYPE_PUBLIC_READ:
      return 'Everyone can access';

    case VisibilityType.VISIBILITY_TYPE_PRIVATE:
      return 'Private';

    case VisibilityType.VISIBILITY_TYPE_INHERIT:
      return 'Inherit';

    case VisibilityType.UNRECOGNIZED:
    default:
      return 'Unrecognized';
  }
};

const viewFileByAxiosResponse = (result: AxiosResponse) => {
  try {
    const { data, headers: resultHeaders } = result;
    const blob = new Blob([data], { type: resultHeaders['content-type'] });
    const fileURL = URL.createObjectURL(blob);
    window.open(fileURL);
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

export {
  formatBytes,
  getObjectInfo,
  renderFeeValue,
  renderUsd,
  renderBnb,
  contentTypeToExtension,
  renderBalanceNumber,
  renderInsufficientBalance,
  directlyDownload,
  getQuota,
  transformVisibility,
  downloadWithProgress,
  viewFileByAxiosResponse,
  saveFileByAxiosResponse,
  truncateFileName,
  renderPrelockedFeeValue,
};
