import { Box, BoxProps, Flex } from '@totejs/uikit';
import { StartBuild } from './components/StartBuild';
import { useAsyncEffect } from 'ahooks';
import { useState } from 'react';
import { GAS_PRICE, TStoreFeeParams, selectBnbPrice, selectMainnetStoreFeeParams, selectStoreFeeParams } from '@/store/slices/global';
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
import { useAppSelector } from '@/store';

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

// 如果是mainnet则最好使用统一的数据源
// 如果不是需要使用mainnet的数据源，单独获取吗
// 要不要直接把这里分开
export const PriceCalculator = ({pageProps}: any) => {
  const [sps, setSps] = useState<TQuotaSP[]>([]);
  const [gasFee, setGasFee] = useState(DEFAULT_GAS_FEE);
  const mainnetStoreFeeParams = useAppSelector(selectMainnetStoreFeeParams);
  const bnbPrice = useAppSelector(selectBnbPrice);
  useAsyncEffect(async () => {
    const [gasFees, error] = await getGasFees('mainnet');
    const gasLimit =
      gasFees?.msgGasParams.find((item) => item.msgTypeUrl === DEFAULT_TX_TYPE)?.fixedType?.fixedGas
        .low || DEFAULT_GAS_LIMIT;
    const gasFee = +GAS_PRICE * gasLimit;
    setGasFee(gasFee + '');
    const sps = await getStorageProviders('mainnet');
    const spMeta = await getSpMeta('mainnet');
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
          <Calculator storeParams={mainnetStoreFeeParams} bnbPrice={bnbPrice} gasFee={gasFee} />
        </Flex>
        <PricingCard storeParams={mainnetStoreFeeParams} />
        <SPFreeQuota sps={sps} />
        <FAQ />
        <StartBuild />
      </Flex>
    </>
  );
};
