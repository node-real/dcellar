import { DCButton } from '@/components/common/DCButton';
import { Tips } from '@/components/common/Tips';
import { CRYPTOCURRENCY_DISPLAY_PRECISION, DECIMAL_NUMBER } from '@/modules/wallet/constants';
import { TStoreFeeParams } from '@/store/slices/global';
import { BN } from '@/utils/BigNumber';
import { currencyFormatter } from '@/utils/currencyFormatter';
import { getQuotaNetflowRate, getStoreNetflowRate } from '@/utils/payment';
import { getUTC0Month } from '@/utils/time';
import { Box, Divider, Flex, Input, Link, Text, useDisclosure } from '@totejs/uikit';
import React, { useMemo, useState } from 'react';
import { FeeItem } from './FeeItem';
import { SizeMenu } from './SizeMenu';
import { NumInput } from './NumInput';
import { Sizes, TSize, TTime, TTimeOption, TimeOptions, TimeUnits, Times } from '../utils';
import { CustomTime } from './CustomTime';

type CalculatorProps = {
  storeParams: TStoreFeeParams;
  bnbPrice: string;
  gasFee: string;
};

const formatInput = (value: string) => {
  if (value === '' || isNaN(Number(value))) {
    return '0';
  }
  return value;
};
export const displayUsd = (fee: string, bnbPrice: string) => {
  return currencyFormatter(
    BN(fee || 0)
      .times(BN(bnbPrice))
      .toString(DECIMAL_NUMBER),
  );
};
export const Calculator = ({ storeParams, bnbPrice, gasFee }: CalculatorProps) => {
  const { isOpen, onClose, onToggle } = useDisclosure();
  const updateMonth = getUTC0Month();
  const [storageSize, setStorageSize] = useState<{
    size: string;
    unit: string;
  }>({
    size: '',
    unit: 'GB',
  });
  const [quotaSize, setQuotaSize] = useState({
    size: '',
    unit: 'GB',
  });
  const [gasTimes, setGasTimes] = useState('');
  const [storageTime, setStorageTime] = useState(TimeOptions[0]);
  const [customStorageTime, setCustomStorageTime] = useState(TimeOptions[2]);
  const sizes = Object.keys(Sizes);
  const storeNetflowRate = useMemo(() => {
    return BN(getStoreNetflowRate(Sizes[storageSize.unit as TSize], storeParams))
      .times(Times['m'])
      .dividedBy(10 ** 18)
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toString();
  }, [storageSize.unit, storeParams]);
  const storageFee = useMemo(() => {
    if (!storeParams.primarySpStorePrice) return;
    if (!+storageSize.size) return '0';
    return BN(
      getStoreNetflowRate(
        BN(+storageSize.size)
          .times(Sizes[storageSize.unit as TSize])
          .toNumber(),
        storeParams,
      ),
    )
      .times(Times['m'])
      .dividedBy(10 ** 18)
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toString();
  }, [storageSize, storeParams]);
  const quotaNetflowRate = useMemo(() => {
    return BN(getQuotaNetflowRate(Sizes[quotaSize.unit as TSize], storeParams))
      .times(Times['m'])
      .dividedBy(10 ** 18)
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toString();
  }, [quotaSize.unit, storeParams]);
  const quotaFee = useMemo(() => {
    if (!storeParams.primarySpStorePrice) return;
    if (!+quotaSize.size) return '0';
    return BN(
      getQuotaNetflowRate(
        BN(quotaSize.size)
          .times(Sizes[quotaSize.unit as TSize])
          .toNumber(),
        storeParams,
      ),
    )
      .times(Times['m'])
      .dividedBy(10 ** 18)
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toString();
  }, [quotaSize, storeParams]);

  const totalGasFee = useMemo(() => {
    return BN(gasTimes || 0)
      .times(gasFee)
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toString();
  }, [gasFee, gasTimes]);
  const costs = useMemo(() => {
    let storeTime =
      storageTime.id === 'custom'
        ? BN(customStorageTime.value).times(Times[customStorageTime.unit as TTime])
        : BN(storageTime.value).times(Times[storageTime.unit as TTime]);

    const totalStorageSize = BN(formatInput(storageSize.size))
      .times(Sizes[storageSize.unit as TSize])
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toNumber();
    const totalStorageCost =
      totalStorageSize === 0
        ? '0'
        : BN(getStoreNetflowRate(totalStorageSize, storeParams))
            .times(storeTime)
            .dividedBy(10 ** 18)
            .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
            .toString();

    const totalQuotaSize = BN(formatInput(quotaSize.size))
      .times(Sizes[quotaSize.unit as TSize])
      .toNumber();
    const totalQuotaCost =
      totalStorageSize === 0
        ? '0'
        : BN(getQuotaNetflowRate(totalQuotaSize, storeParams))
            .times(storeTime)
            .dividedBy(10 ** 18)
            .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
            .toString();

    const timesByDay = BN(gasTimes || 0).dividedBy(30);
    const storeDays = BN(storeTime).dividedBy(24 * 60 * 60);
    const totalGasCost = BN(timesByDay || 0)
      .times(gasFee)
      .times(storeDays)
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toString();

    const totalCost = BN(totalStorageCost)
      .plus(totalQuotaCost)
      .plus(totalGasCost)
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toString();
    // 算出每个月的钱，所有的钱处以三十天
    const averageMonthCost = BN(totalCost)
      .dividedBy(Times['m'])
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toString();

    return {
      totalStorageCost,
      totalQuotaCost,
      totalGasCost,
      totalCost,
      averageMonthCost,
    };
  }, [
    customStorageTime.unit,
    customStorageTime.value,
    gasFee,
    gasTimes,
    quotaSize.size,
    quotaSize.unit,
    storageSize.size,
    storageSize.unit,
    storageTime,
    storeParams,
  ]);

  const storageTimeDisplay = useMemo(() => {
    if (storageTime.id === 'custom') {
      return `${customStorageTime.value} ${TimeUnits[customStorageTime.unit]}${
        +customStorageTime.value > 1 ? 's' : ''
      }`;
    }
    return `${storageTime.value} ${TimeUnits[storageTime.unit]}${
      +customStorageTime.value > 1 ? 's' : ''
    }`;
  }, [
    customStorageTime.unit,
    customStorageTime.value,
    storageTime.id,
    storageTime.unit,
    storageTime.value,
  ]);
  return (
    <Box
      margin={'40px auto'}
      w={954}
      borderRadius={4}
      boxShadow="0px 4px 24px 0px rgba(0, 0, 0, 0.08)"
      bg={'#fff'}
      padding={'16px 40px'}
    >
      <Box fontSize={14} fontWeight={500} color={'readable.tertiary'} textAlign={'right'}>
        Prices are updated monthly: {updateMonth}
      </Box>
      <Flex flexDirection={'column'} gap={40}>
        <Flex gap={8} flexDirection={'column'}>
          <Flex fontSize={16} fontWeight={600}>
            Total Storage Size
            <Tips
              placement={'top'}
              w={262}
              tips={
                <>
                  <Text display={'inline-block'}>Check out&nbsp;</Text>
                  <Link display={'inline-block'} cursor={'pointer'} href="####">
                    the Storage Fee Formula
                  </Link>
                  .
                </>
              }
            />
          </Flex>
          <Text fontSize={12}>What's your estimated Storage Size?</Text>
          <Flex alignItems={'center'} gap={12}>
            <NumInput
              value={storageSize.size}
              onChangeValue={(value) =>
                setStorageSize({
                  ...storageSize,
                  size: value,
                })
              }
            />
            <SizeMenu
              sizes={sizes}
              value={storageSize.unit}
              onItemClick={(item) =>
                setStorageSize({
                  ...storageSize,
                  unit: item,
                })
              }
            />
            <Text fontSize={14} fontWeight={600}>
              X
            </Text>
            <Flex flexDirection={'column'}>
              <Text fontWeight={600}>{storeNetflowRate}</Text>
              <Text color="readable.tertiary">BNB/{storageSize.unit}/month</Text>
            </Flex>
            <Flex flexDirection={'column'} flex={1} textAlign={'right'}>
              <Text fontWeight={600}>= {storageFee} BNB/month</Text>
              <Text color="readable.tertiary" wordBreak={'break-all'}>
                ({displayUsd(storageFee || '0', bnbPrice)})
              </Text>
            </Flex>
          </Flex>
        </Flex>
        <Flex gap={8} flexDirection={'column'}>
          <Flex fontSize={16} fontWeight={600}>
            Monthly Download Quota
            <Tips
              placement={'top'}
              w={262}
              tips={
                <Text display={'inline-block'}>
                  Each bucket has a one-time free quota offered by SP.
                </Text>
              }
            />
          </Flex>
          <Text fontSize={12}>How much monthly download quota do you require? </Text>
          <Flex alignItems={'center'} gap={12}>
            <NumInput
              value={quotaSize.size}
              onChangeValue={(value) =>
                setQuotaSize({
                  ...quotaSize,
                  size: value,
                })
              }
            />
            <SizeMenu
              sizes={sizes}
              value={quotaSize.unit}
              onItemClick={(item) =>
                setQuotaSize({
                  ...quotaSize,
                  unit: item,
                })
              }
            />
            <Text fontSize={14} fontWeight={600}>
              X
            </Text>
            <Flex flexDirection={'column'}>
              <Text fontWeight={600}>{quotaNetflowRate}</Text>
              <Text color="readable.tertiary">BNB/{quotaSize.unit}/month</Text>
            </Flex>
            <Flex flexDirection={'column'} flex={1} textAlign={'right'}>
              <Text fontWeight={600}>= {quotaFee} BNB/month</Text>
              <Text color="readable.tertiary" wordBreak={'break-all'}>
                ({displayUsd(quotaFee || '0', bnbPrice)})
              </Text>
            </Flex>
          </Flex>
        </Flex>

        <Flex gap={8} flexDirection={'column'}>
          <Flex fontSize={16} fontWeight={600}>
            Monthly Operation Gas Fee
          </Flex>
          <Text fontSize={12}>
            How many monthly operations do you anticipate? (Uploads, deletions, shares, etc.)
          </Text>
          <Flex alignItems={'center'} gap={12}>
            <NumInput value={gasTimes} onChangeValue={(value) => setGasTimes(value)} />
            <Text fontSize={12} color={'readable.tertiary'}>
              times/month
            </Text>
            <Text fontSize={14} fontWeight={600}>
              X
            </Text>
            <Flex flexDirection={'column'}>
              <Text fontWeight={600}>～{gasFee}</Text>
              <Text color="readable.tertiary">BNB/operation</Text>
            </Flex>
            <Flex flexDirection={'column'} flex={1} textAlign={'right'}>
              <Text fontWeight={600}>= {totalGasFee} BNB/month</Text>
              <Text color="readable.tertiary" wordBreak={'break-all'}>
                ({displayUsd(totalGasFee || '0', bnbPrice)})
              </Text>
            </Flex>
          </Flex>
        </Flex>

        <Flex gap={8} flexDirection={'column'}>
          <Text fontSize={16} fontWeight={600}>
            Storage Time
          </Text>
          <Flex gap={12}>
            {TimeOptions.map((item) => (
              <>
                {item.id !== 'custom' && (
                  <DCButton
                    key={item.title}
                    variant="ghost"
                    borderColor={item.id === storageTime.id ? 'readable.brand6' : 'readable.border'}
                    onClick={() => setStorageTime(item)}
                  >
                    {item.title}
                  </DCButton>
                )}
                {item.id === 'custom' && (
                  <CustomTime
                    isOpen={isOpen}
                    selected={item.id === storageTime.id}
                    customStorageTime={customStorageTime}
                    onClose={onClose}
                    onToggle={onToggle}
                    onChangeButton={() =>
                      setStorageTime({ ...storageTime, id: 'custom', title: 'Custom' })
                    }
                    onChangeInput={(option) => {
                      setCustomStorageTime(option);
                    }}
                  />
                  // <DCButton
                  //   key={item.title}
                  //   variant="ghost"
                  //   borderColor={item.id === storageTime.id ? 'readable.brand6' : 'readable.border'}
                  //   onClick={() => setStorageTime(item)}
                  // >
                  //   {item.title}
                  // </DCButton>
                )}
              </>
            ))}
          </Flex>
          <Text fontSize={'12'}>
            * Storage fees for at least 6 months must be paid even if you store for less than 6
            months.
          </Text>
        </Flex>
        <Divider />
        <Flex gap={16} flexDirection={'column'}>
          <Box>
            <Flex justifyContent={'space-between'} fontSize={24} fontWeight={600} mb={8}>
              <Text>Estimated Total Cost</Text>
              <Text textAlign={'right'}>
                {costs.totalCost} BNB
                <Text
                  wordBreak={'break-all'}
                  color={'readable.tertiary'}
                  ml={4}
                  fontWeight={400}
                  display={'inline-block'}
                >
                  ({displayUsd(costs.totalCost || '0', bnbPrice)})
                </Text>
              </Text>
            </Flex>
            <Box textAlign={'right'}>
              <Text display={'inline-block'}>{costs.averageMonthCost} BNB/month</Text>
              <Text display={'inline-block'}>
                ({displayUsd(costs.averageMonthCost, bnbPrice)}/month)
              </Text>
            </Box>
          </Box>
          <FeeItem
            title="Storage fee"
            storeTime={storageTimeDisplay}
            size={storageSize.size}
            unit={storageSize.unit}
            fee={costs.totalStorageCost}
            bnbPrice={bnbPrice}
          />
          <FeeItem
            title="Download fee"
            storeTime={storageTimeDisplay}
            size={quotaSize.size}
            unit={quotaSize.unit}
            fee={costs.totalQuotaCost}
            bnbPrice={bnbPrice}
          />
          <FeeItem
            title="Operation fee"
            storeTime={storageTimeDisplay}
            size={gasTimes}
            unit={''}
            fee={costs.totalGasCost}
            bnbPrice={bnbPrice}
          />
          <Text>*1 month=30 day</Text>
        </Flex>
      </Flex>
    </Box>
  );
};
