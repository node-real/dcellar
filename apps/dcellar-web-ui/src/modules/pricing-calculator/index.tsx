import { getTimestampInSeconds } from '@/utils/time';
import { Box, BoxProps, Flex } from '@totejs/uikit';
import { StartBuild } from './components/StartBuild';
import { useAsyncEffect } from 'ahooks';
import { getStoreFeeParams } from '@/facade/payment';
import { useState } from 'react';
import { GAS_PRICE, TStoreFeeParams } from '@/store/slices/global';
import { getBnbPrice, getGasFees } from '@/facade/common';
import { assetPrefix } from '@/base/env';
import { FAQ } from './components/FAQ';
import { SPFreeQuota } from './components/SPFreeQuota';
import { PricingCard } from './components/PricingCard';
import { Banner } from './components/Banner';
import { Calculator } from './components/Calculator';
import { MsgCreateObjectTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { getSpMeta, getStorageProviders } from '@/facade/sp';
import { keyBy } from 'lodash-es';
import { SEOHead } from './components/SEOHead';

type TQuotaSP = {
  name: string;
  freeQuota: string;
  operatorAddress: string;
};
const DEFAULT_GAS_FEE = '0.000006';
const DEFAULT_GAS_LIMIT = 1200;
const DEFAULT_TX_TYPE = MsgCreateObjectTypeUrl;
export const lgMedia = `@media (min-width: 978px)`;
export const mdMedia = `@media (min-width: 768px) and (max-width: 977px)`;
export const smMedia = `@media (max-width: 767px)`;

export type PriceResponsiveProps = BoxProps & React.PropsWithChildren;

export const PriceResponsiveContainer = ({ children, sx, ...restProps }: PriceResponsiveProps) => {
  return (
    <Box
      margin={'auto auto'}
      sx={{
        [lgMedia]: {
          width: '954px',
        },
        [mdMedia]: {
          width: 'calc(100% - 40px)',
          minWidth: '351px',
        },
        [smMedia]: {
          width: 'calc(100% - 40px)',
          minWidth: '351px',
        },
      }}
      {...restProps}
    >
      {children}
    </Box>
  );
};

export const PriceCalculator = () => {
  const [storeParams, setStoreParams] = useState({} as TStoreFeeParams);
  const [bnbPrice, setBnbPrice] = useState('0');
  const [sps, setSps] = useState<TQuotaSP[]>([]);
  const [gasFee, setGasFee] = useState(DEFAULT_GAS_FEE);
  useAsyncEffect(async () => {
    const curTime = getTimestampInSeconds();
    console.time('getStoreFeeParams');
    const latestStoreParams = await getStoreFeeParams(curTime);
    console.timeEnd('getStoreFeeParams');
    setStoreParams(latestStoreParams);
  }, []);
  useAsyncEffect(async () => {
    console.log('invoke client render');
    const bnbPrice = await getBnbPrice();
    console.log('invoke client render bnbPrice', bnbPrice);
    setBnbPrice(bnbPrice.price);
    const [gasFees, error] = await getGasFees();
    const gasLimit =
      gasFees?.msgGasParams.find((item) => item.msgTypeUrl === DEFAULT_TX_TYPE)?.fixedType?.fixedGas
        .low || DEFAULT_GAS_LIMIT;
    const gasFee = +GAS_PRICE * gasLimit;
    setGasFee(gasFee + '');
    const sps = await getStorageProviders();
    const spMeta = await getSpMeta();
    const keySpMeta = keyBy(spMeta, 'SPAddress');
    const fullSps = sps.map((item) => {
      return {
        operatorAddress: item.operatorAddress,
        name: item?.description?.moniker,
        freeQuota: String(keySpMeta[item.operatorAddress]?.FreeReadQuota || ''),
      };
    });
    setSps(fullSps);
  }, []);

  return (
    <>
      <SEOHead />
      <Flex
        gap={80}
        paddingBottom={'40px'}
        flexDirection={'column'}
        bgColor={'#fff'}
        sx={{
          [smMedia]: {
            paddingBottom: '20px',
          },
        }}
      >
        <Flex
          paddingTop={64}
          bg={`center/cover no-repeat url(${assetPrefix}/images/price/bg.svg), right bottom no-repeat url(${assetPrefix}/images/price/bg_2.svg)`}
          flexDirection={'column'}
          sx={{
            [smMedia]: {
              bg: `center/cover no-repeat url(${assetPrefix}/images/price/bg.svg)`,
            },
          }}
        >
          <Banner />
          <Calculator storeParams={storeParams} bnbPrice={bnbPrice} gasFee={gasFee} />
        </Flex>
        <PricingCard storeParams={storeParams} />
        <SPFreeQuota sps={sps} />
        <FAQ />
        <StartBuild />
      </Flex>
    </>
  );
};
