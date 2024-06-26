import { Flex, Text, toast } from '@node-real/uikit';
import { useMount } from 'ahooks';
import NextLink from 'next/link';
import { memo, useEffect, useState } from 'react';

import { GAClick, GAShow } from '@/components/common/GATracker';
import { InternalRoutePaths } from '@/constants/paths';
import {
  CRYPTOCURRENCY_DISPLAY_PRECISION,
  FIAT_CURRENCY_DISPLAY_PRECISION,
} from '@/modules/wallet/constants';
import { BN } from '@/utils/math';
import { displayTokenSymbol, getNumInDigits } from '@/utils/wallet';
import { useAccountType } from '@/hooks/useAccountType';

const renderFeeValue = (bnbValue: string, exchangeRate: number | string) => {
  if (!bnbValue || Number(bnbValue) < 0 || isNaN(Number(bnbValue))) {
    return '--';
  }

  return `${renderBnb(bnbValue)} ${displayTokenSymbol()} (${renderUsd(bnbValue, exchangeRate)})`;
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
  return `${getNumInDigits(
    availableBalance,
    CRYPTOCURRENCY_DISPLAY_PRECISION,
  )} ${displayTokenSymbol()}`;
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
        <NextLink href={InternalRoutePaths.transfer_in} passHref legacyBehavior>
          <Text style={{ textDecoration: 'underline' }} color="#EE3911" cursor={'pointer'}>
            Transfer in
          </Text>
        </NextLink>
      </GAClick>
    </GAShow>
  );
};

const directlyDownload = (url: string, target = '_self', name?: string) => {
  if (!url) {
    toast.error({
      description: 'Download URL does not exist. Please check.',
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
    const { isSponsor } = useAccountType(payAccount);

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
      if (isOwnerAccount || isSponsor) {
        // If is owner account, bankBalance can pay store fee.
        if (
          BN(payGasFeeBalance).lt(BN(gasFee)) ||
          (isOwnerAccount &&
            BN(BN(payGasFeeBalance).plus(payStoreFeeBalance)).lt(
              BN(gasFee).plus(storeFee).plus(settlementFee).minus(refundFee),
            ))
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
      <Flex color={'#EE3911'} flexDirection={'column'} gap={4}>
        {items.map((item, index) => (
          <GAShow key={index} name={gaOptions?.gaShowName}>
            <Flex>
              Insufficient balance.&nbsp;
              <GAClick name={gaOptions?.gaClickName}>
                <NextLink href={item.link} passHref legacyBehavior>
                  <Text
                    cursor={'pointer'}
                    display={'inline'}
                    style={{ textDecoration: 'underline' }}
                    color="#EE3911"
                    _hover={{ color: '#EE3911' }}
                  >
                    {item.text}
                  </Text>
                </NextLink>
              </GAClick>
            </Flex>
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
  isSponsor = false,
}: {
  gasFee: string | number;
  storeFee: string;
  settlementFee: string;
  refundFee: string;
  payGasFeeBalance: string;
  payStoreFeeBalance: string;
  ownerAccount: string;
  payAccount: string;
  isSponsor?: boolean;
  gaOptions?: { gaClickName: string; gaShowName: string };
}) => {
  if (!gasFee || Number(gasFee) < 0) return <></>;
  const items = [];
  const isOwnerAccount = ownerAccount === payAccount;
  if (isOwnerAccount || isSponsor) {
    // If is owner account, bankBalance can pay store fee.
    if (
      BN(payGasFeeBalance).lt(BN(gasFee)) ||
      (isOwnerAccount &&
        BN(BN(payGasFeeBalance).plus(payStoreFeeBalance)).lt(
          BN(gasFee).plus(storeFee).plus(settlementFee).minus(refundFee),
        ))
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
    <Flex color={'#EE3911'} flexDirection={'column'} gap={4}>
      {items.map((item, index) => (
        <GAShow key={index} name={gaOptions?.gaShowName}>
          <Flex>
            Insufficient balance.&nbsp;
            <GAClick name={gaOptions?.gaClickName}>
              <NextLink href={item.link} passHref legacyBehavior>
                <Text
                  display={'inline'}
                  style={{ textDecoration: 'underline' }}
                  color="#EE3911"
                  _hover={{ color: '#EE3911' }}
                >
                  {item.text}
                </Text>
              </NextLink>
            </GAClick>
          </Flex>
        </GAShow>
      ))}
    </Flex>
  );
};

export {
  contentIconTypeToExtension,
  contentTypeToExtension,
  directlyDownload,
  renderBalanceNumber,
  renderBnb,
  renderFeeValue,
  renderInsufficientBalance,
  renderPaymentInsufficientBalance,
  renderUsd,
};

export const ActionTypeValue: Record<string, number> = {
  ACTION_UNSPECIFIED: 0,
  ACTION_UPDATE_BUCKET_INFO: 1,
  ACTION_DELETE_BUCKET: 2,
  ACTION_CREATE_OBJECT: 3,
  ACTION_DELETE_OBJECT: 4,
  ACTION_COPY_OBJECT: 5,
  ACTION_GET_OBJECT: 6,
  ACTION_EXECUTE_OBJECT: 7,
  ACTION_LIST_OBJECT: 8,
  ACTION_UPDATE_GROUP_MEMBER: 9,
  ACTION_DELETE_GROUP: 10,
  ACTION_UPDATE_OBJECT_INFO: 11,
  ACTION_UPDATE_GROUP_EXTRA: 12,
  ACTION_TYPE_ALL: 99,
  UNRECOGNIZED: -1,
};
