import { Box, Divider, Flex, Loading, Text, useDisclosure, useMediaQuery } from '@node-real/uikit';
import { isEmpty } from 'lodash-es';
import { useMemo, useState } from 'react';

import { PriceResponsiveContainer } from '..';
import { Sizes, TSize, TTime, TimeOptions, TimeUnits, Times } from '../utils';
import { JumpLink } from './Common';
import { CustomTime } from './CustomTime';
import { FeeItem } from './FeeItem';
import { NumInput } from './NumInput';
import { SizeMenu } from './SizeMenu';

import { getUTC0Month } from '@/utils/time';
import { getQuotaNetflowRate, getStoreNetflowRate } from '@/utils/payment';
import { BN } from '@/utils/math';
import { currencyFormatter } from '@/utils/formatter';
import { StoreFeeParams } from '@/store/slices/global';
import { CRYPTOCURRENCY_DISPLAY_PRECISION, DECIMAL_NUMBER } from '@/modules/wallet/constants';
import { smMedia } from '@/modules/responsive';
import { Tips } from '@/components/common/Tips';
import { DCButton } from '@/components/common/DCButton';

type CalculatorProps = {
  storeParams: StoreFeeParams;
  bnbPrice: string;
  onOpenKey: (key: number) => void;
  // gasFee: string;
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

export const Calculator = ({ storeParams, bnbPrice, onOpenKey }: CalculatorProps) => {
  const [isMobile] = useMediaQuery('(max-width: 767px)');
  const TOKEN_SYMBOL = 'BNB';
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
  // const [gasTimes, setGasTimes] = useState('');
  const [storageTime, setStorageTime] = useState(TimeOptions[0]);
  const [customStorageTime, setCustomStorageTime] = useState(TimeOptions[2]);
  const sizes = Object.keys(Sizes);

  const storeNetflowRate = useMemo(() => {
    if (isEmpty(storeParams)) return <Loading color="readable.normal" size={16} />;
    return BN(getStoreNetflowRate(Sizes[storageSize.unit as TSize], storeParams))
      .times(Times['m'])
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
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toString();
  }, [storageSize, storeParams]);

  const quotaNetflowRate = useMemo(() => {
    if (isEmpty(storeParams)) return <Loading color="readable.normal" size={16} />;
    return BN(getQuotaNetflowRate(Sizes[quotaSize.unit as TSize], storeParams))
      .times(Times['m'])
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
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toString();
  }, [quotaSize, storeParams]);

  // const totalGasFee = useMemo(() => {
  //   return BN(gasTimes || 0)
  //     .times(gasFee)
  //     .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
  //     .toString();
  // }, [gasFee, gasTimes]);
  const costs = useMemo(() => {
    const storeTime =
      storageTime.id === 'custom'
        ? BN(formatInput(customStorageTime.value))
            .times(Times[customStorageTime.unit as TTime])
            .toString()
        : BN(formatInput(storageTime.value))
            .times(Times[storageTime.unit as TTime])
            .toString();

    const totalStorageSize = BN(formatInput(storageSize.size))
      .times(Sizes[storageSize.unit as TSize])
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toNumber();
    const totalStorageCost =
      totalStorageSize === 0
        ? '0'
        : BN(getStoreNetflowRate(totalStorageSize, storeParams))
            .times(storeTime)
            .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
            .toString();

    const totalQuotaSize = BN(formatInput(quotaSize.size))
      .times(Sizes[quotaSize.unit as TSize])
      .toNumber();
    const totalQuotaCost =
      totalQuotaSize === 0
        ? '0'
        : BN(getQuotaNetflowRate(totalQuotaSize, storeParams))
            .times(storeTime)
            .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
            .toString();

    // const timesByDay = BN(gasTimes || 0).dividedBy(30);
    // const storeDays = BN(storeTime).dividedBy(24 * 60 * 60);
    // const totalGasCost = BN(timesByDay || 0)
    //   .times(gasFee)
    //   .times(storeDays)
    //   .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
    //   .toString();

    // .plus(totalGasCost)
    const totalCost = BN(totalStorageCost)
      .plus(totalQuotaCost)
      .dp(CRYPTOCURRENCY_DISPLAY_PRECISION)
      .toString();

    const months = BN(storeTime).dividedBy(Times['m']).toString();
    const averageMonthCost =
      months === '0'
        ? '0'
        : BN(totalCost).dividedBy(months).dp(CRYPTOCURRENCY_DISPLAY_PRECISION).toString();

    return {
      totalStorageCost,
      totalQuotaCost,
      // totalGasCost,
      totalCost,
      averageMonthCost,
    };
  }, [
    customStorageTime.unit,
    customStorageTime.value,
    // gasFee,
    // gasTimes,
    quotaSize.size,
    quotaSize.unit,
    storageSize.size,
    storageSize.unit,
    storageTime,
    storeParams,
  ]);

  const storageTimeDisplay = useMemo(() => {
    if (storageTime.id === 'custom') {
      return `${customStorageTime.value || 0} ${TimeUnits[customStorageTime.unit]}${
        +customStorageTime.value > 1 ? 's' : ''
      }`;
    }
    return `${storageTime.value || 0} ${TimeUnits[storageTime.unit]}${
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
    <PriceResponsiveContainer
      margin={['20px auto', '40px auto']}
      borderRadius={4}
      boxShadow="0px 4px 24px 0px rgba(0, 0, 0, 0.08)"
      bg={'#fff'}
      padding={['16px', '16px 40px']}
    >
      <Flex
        flexDirection={'column'}
        gap={40}
        marginTop={8}
        sx={{
          [smMedia]: {
            gap: '0',
          },
        }}
      >
        <Flex
          justifyContent={'space-between'}
          sx={{
            [smMedia]: {
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '24px',
            },
          }}
        >
          <Text
            fontSize={18}
            fontWeight={600}
            sx={{
              [smMedia]: {
                fontSize: 16,
              },
            }}
          >
            BNB Greenfield Mainnet
          </Text>
          <Text
            fontSize={14}
            fontWeight={500}
            color={'readable.tertiary'}
            textAlign={'right'}
            sx={{
              [smMedia]: {
                fontSize: '12px',
                textAlign: 'left',
              },
            }}
          >
            Prices are updated monthly: {updateMonth}
          </Text>
        </Flex>
        <Flex gap={8} flexDirection={'column'}>
          <Flex
            fontSize={16}
            fontWeight={600}
            sx={{
              [smMedia]: {
                fontSize: '14px',
              },
            }}
          >
            Total Storage Size
            <Tips
              placement={'top'}
              w={262}
              tips={
                <>
                  <Text display={'inline-block'}>Check out&nbsp;</Text>
                  <JumpLink id="#faq" openKey={0} onOpenKey={onOpenKey}>
                    the Storage Fee Formula
                  </JumpLink>
                  .
                </>
              }
            />
          </Flex>
          <Text fontSize={12}>What&apos;s your estimated Storage Size?</Text>
          <Flex alignItems={'center'} flexWrap={'wrap'} gap={12}>
            <NumInput
              value={storageSize.size}
              onChangeValue={(value) =>
                setStorageSize({
                  ...storageSize,
                  size: value,
                })
              }
              placeholder="0.0"
              sx={{
                [smMedia]: {
                  flex: '1',
                  h: '33px',
                  fontSize: '14px',
                },
              }}
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
            <Box fontSize={14} fontWeight={600}>
              X
            </Box>
            <Flex flexDirection={'column'}>
              <Box fontWeight={600}>{storeNetflowRate}</Box>
              <Box color="readable.tertiary" fontSize={12}>
                {TOKEN_SYMBOL}/{storageSize.unit}/month
              </Box>
            </Flex>
            <Flex
              sx={{
                [smMedia]: {
                  flex: 'none',
                  width: '100%',
                },
              }}
              flexDirection={'column'}
              flex={1}
              textAlign={'right'}
            >
              <Text fontWeight={600}>
                = {storageFee} {TOKEN_SYMBOL}/month
              </Text>
              <Text color="readable.tertiary" wordBreak={'break-all'}>
                &nbsp;({displayUsd(storageFee || '0', bnbPrice)})
              </Text>
            </Flex>
          </Flex>
        </Flex>
        <Flex gap={8} flexDirection={'column'}>
          <Flex
            fontSize={16}
            fontWeight={600}
            sx={{
              [smMedia]: {
                fontSize: '14px',
              },
            }}
          >
            Monthly Download Quota
            <Tips
              placement={'top'}
              w={'fit-content'}
              tips={
                <>
                  Learn More about{' '}
                  <JumpLink id="#download_quota" openKey={4} onOpenKey={onOpenKey}>
                    Quota
                  </JumpLink>
                  .
                </>
              }
            />
          </Flex>
          <Text fontSize={12}>
            How much network traffic will cost for your download and view activities within one
            month?{' '}
          </Text>
          <Flex alignItems={'center'} gap={12} flexWrap={'wrap'}>
            <NumInput
              placeholder="0.0"
              value={quotaSize.size}
              onChangeValue={(value) =>
                setQuotaSize({
                  ...quotaSize,
                  size: value,
                })
              }
              sx={{
                [smMedia]: {
                  flex: '1',
                  h: '33px',
                  fontSize: '14px',
                },
              }}
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
            <Box fontSize={14} fontWeight={600}>
              X
            </Box>
            <Flex flexDirection={'column'}>
              <Box fontWeight={600}>{quotaNetflowRate}</Box>
              <Box color="readable.tertiary" fontSize={12}>
                {TOKEN_SYMBOL}/{quotaSize.unit}/month
              </Box>
            </Flex>
            <Flex
              flexDirection={'column'}
              flex={1}
              textAlign={'right'}
              sx={{
                [smMedia]: {
                  flex: 'none',
                  width: '100%',
                },
              }}
            >
              <Text fontWeight={600}>
                = {quotaFee} {TOKEN_SYMBOL}/month
              </Text>
              <Text color="readable.tertiary" wordBreak={'break-all'}>
                &nbsp;({displayUsd(quotaFee || '0', bnbPrice)})
              </Text>
            </Flex>
          </Flex>
        </Flex>
        {/* <Flex gap={8} flexDirection={'column'}>
          <Flex
            fontSize={16}
            fontWeight={600}
            sx={{
              [smMedia]: {
                fontSize: '14px',
              },
            }}
          >
            Monthly Operation Gas Fee
          </Flex>
          <Text fontSize={12}>
            How many monthly operations do you anticipate? (Uploads, deletions, shares, etc.)
          </Text>
          <Flex alignItems={'center'} gap={12} flexWrap={'wrap'}>
            <NumInput
              placeholder="0"
              value={gasTimes}
              onChangeValue={(value) => setGasTimes(value)}
              type="inter"
              sx={{
                [smMedia]: {
                  flex: '1',
                  h: '33px',
                  fontSize: '14px',
                },
              }}
            />
            <Text fontSize={12} color={'readable.tertiary'}>
              times/month
            </Text>
            <Text fontSize={14} fontWeight={600}>
              X
            </Text>
            <Flex flexDirection={'column'}>
              <Text fontWeight={600}>～{gasFee}</Text>
              <Text color="readable.tertiary" fontSize={12}>
                {TOKEN_SYMBOL}/operation
              </Text>
            </Flex>
            <Flex
              flexDirection={'column'}
              flex={1}
              textAlign={'right'}
              sx={{
                [smMedia]: {
                  flex: 'none',
                  width: '100%',
                },
              }}
            >
              <Text fontWeight={600}>
                = {totalGasFee} {TOKEN_SYMBOL}/month
              </Text>
              <Text color="readable.tertiary" wordBreak={'break-all'}>
                &nbsp;({displayUsd(totalGasFee || '0', bnbPrice)})
              </Text>
            </Flex>
          </Flex>
        </Flex> */}
        <Flex gap={8} flexDirection={'column'}>
          <Text
            fontSize={16}
            fontWeight={600}
            sx={{
              [smMedia]: {
                fontSize: '14px',
              },
            }}
          >
            Storage Time
          </Text>
          <Flex gap={12} flexWrap={'wrap'}>
            {TimeOptions.map((item, index) => (
              <Box key={index}>
                {item.id !== 'custom' && (
                  <DCButton
                    key={item.title}
                    variant="ghost"
                    borderColor={item.id === storageTime.id ? 'brand.brand6' : 'readable.border'}
                    onClick={() => setStorageTime(item)}
                    gaClickName={item.gaClickName}
                    sx={{
                      [smMedia]: {
                        fontSize: '14px',
                        padding: '8px',
                        whiteSpace: 'nowrap',
                        width: 'fit-content',
                        flex: '1',
                      },
                    }}
                  >
                    {item.title}
                  </DCButton>
                )}
                {item.id === 'custom' && (
                  <CustomTime
                    key={index}
                    isOpen={isOpen}
                    selected={item.id === storageTime.id}
                    customStorageTime={customStorageTime}
                    onClose={onClose}
                    onToggle={onToggle}
                    gaClickName={item.gaClickName || ''}
                    onChangeButton={() =>
                      setStorageTime({ ...storageTime, id: 'custom', title: 'Custom' })
                    }
                    onChangeInput={(option) => {
                      setCustomStorageTime(option);
                    }}
                  />
                )}
              </Box>
            ))}
          </Flex>
          <Text fontSize={'12'}>
            * Storage fees for at least 6 months must be paid even if you store for less than 6
            months.
          </Text>
        </Flex>
        <Divider
          sx={{
            [smMedia]: {
              margin: '24px 0',
              display: 'block',
            },
          }}
        />
        <Flex gap={16} flexDirection={'column'}>
          <Box>
            <Flex justifyContent={'space-between'} fontSize={24} fontWeight={600} mb={8}>
              <Text
                sx={{
                  [smMedia]: {
                    fontSize: '16px',
                    whiteSpace: 'nowrap',
                  },
                }}
              >
                {isMobile ? 'Total' : 'Estimated Total Cost'}
              </Text>
              <Box
                textAlign={'right'}
                wordBreak={'break-all'}
                sx={{
                  [smMedia]: {
                    fontSize: '16px',
                  },
                }}
              >
                {costs.totalCost} {TOKEN_SYMBOL}
                <Box
                  wordBreak={'break-all'}
                  color={'readable.tertiary'}
                  ml={4}
                  fontWeight={400}
                  display={isMobile ? 'inline' : 'inline-block'}
                >
                  &nbsp;({displayUsd(costs.totalCost || '0', bnbPrice)})
                </Box>
              </Box>
            </Flex>
            <Box
              textAlign={'right'}
              sx={{
                [smMedia]: {
                  fontSize: '12px',
                },
              }}
            >
              <Box display={'inline-block'}>
                {costs.averageMonthCost} {TOKEN_SYMBOL}/month
              </Box>
              <Box
                display={'inline-block'}
                sx={{
                  [smMedia]: {
                    display: 'inline',
                  },
                }}
              >
                &nbsp;({displayUsd(costs.averageMonthCost, bnbPrice)})
              </Box>
            </Box>
          </Box>
          <FeeItem
            title="Storage fee"
            storeTime={storageTimeDisplay}
            size={storageSize.size}
            unit={`${storageSize.unit}/month`}
            fee={costs.totalStorageCost}
            bnbPrice={bnbPrice}
          />
          <FeeItem
            title="Download fee"
            storeTime={storageTimeDisplay}
            size={quotaSize.size}
            unit={`${quotaSize.unit}/month`}
            fee={costs.totalQuotaCost}
            bnbPrice={bnbPrice}
          />
          {/* <FeeItem
            title="Operation fee"
            storeTime={storageTimeDisplay}
            size={gasTimes}
            unit={`time${+gasTimes > 1 ? 's' : ''}/month`}
            fee={costs.totalGasCost}
            bnbPrice={bnbPrice}
          /> */}
          <Text color={'readable.disabled'}>*1 month=30 day</Text>
        </Flex>
      </Flex>
    </PriceResponsiveContainer>
  );
};
