import { MsgCreateObjectTypeUrl } from '@bnb-chain/greenfield-js-sdk';
import { Box, BoxProps, Flex } from '@node-real/uikit';
import { useAsyncEffect, useMount } from 'ahooks';
import { keyBy } from 'lodash-es';
import { useState } from 'react';

import { Banner } from './components/Banner';
import { Calculator } from './components/Calculator';
import { FAQ } from './components/FAQ';
import { PricingCard } from './components/PricingCard';
import { SEOHead } from './components/SEOHead';
import { SPFreeQuota } from './components/SPFreeQuota';
import { StartBuild } from './components/StartBuild';

import { assetPrefix } from '@/base/env';
import { getSpMeta, getStorageProviders } from '@/facade/sp';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  selectBnbPrice,
  selectMainnetStoreFeeParams,
  setupBnbPrice,
  setupMainnetStoreFeeParams,
} from '@/store/slices/global';

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
  const dispatch = useAppDispatch();
  const [sps, setSps] = useState<TQuotaSP[]>([]);
  const [openKeys, setOpenKeys] = useState<number[]>([]);
  const toggleOpenKeys = (key: number) => {
    if (openKeys.includes(key)) {
      return setOpenKeys(openKeys.filter((item) => item !== key));
    }
    setOpenKeys([...openKeys, key]);
  };
  const onOpenKey = (key: number) => {
    setOpenKeys(Array.from(new Set([key])));
  };
  const mainnetStoreFeeParams = useAppSelector(selectMainnetStoreFeeParams);
  const bnbPrice = useAppSelector(selectBnbPrice);
  // const [gasFee, setGasFee] = useState(DEFAULT_GAS_FEE);
  // useAsyncEffect(async () => {
  //   const [gasFees, error] = await getGasFees('mainnet');
  //   const gasLimit =
  //     gasFees?.msgGasParams.find((item) => item.msgTypeUrl === DEFAULT_TX_TYPE)?.fixedType?.fixedGas
  //       .low || DEFAULT_GAS_LIMIT;
  //   const gasFee = +GAS_PRICE * gasLimit;
  //   setGasFee(gasFee + '');
  // }, []);
  useAsyncEffect(async () => {
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

  useMount(() => {
    dispatch(setupBnbPrice());
    dispatch(setupMainnetStoreFeeParams());
  });

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
          <Calculator
            onOpenKey={onOpenKey}
            storeParams={mainnetStoreFeeParams}
            bnbPrice={bnbPrice}
          />
        </Flex>
        <PricingCard storeParams={mainnetStoreFeeParams} />
        <SPFreeQuota sps={sps} />
        <FAQ openKeys={openKeys} toggleOpenKeys={toggleOpenKeys} />
        <StartBuild />
      </Flex>
    </>
  );
};
