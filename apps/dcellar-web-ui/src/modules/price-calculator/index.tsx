import { DCButton } from '@/components/common/DCButton';
import { SEOHead } from '@/components/common/SEOHead';
import { Tips } from '@/components/common/Tips';
import { UnderlineLink } from '@/components/layout/Footer';
import { getTimestampInSeconds, getUTC0Month } from '@/utils/time';
import { ExternalLinkIcon, MenuCloseIcon, MenuOpenIcon } from '@totejs/icons';
import {
  Box,
  Button,
  Divider,
  Flex,
  Input,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@totejs/uikit';
import { StartBuild } from './components/StartBuild';
import { useAsyncEffect } from 'ahooks';
import { getStoreFeeParams } from '@/facade/payment';
import { useMemo, useState } from 'react';
import { getStoreNetflowRate } from '@/utils/payment';
import { GAS_PRICE, TStoreFeeParams } from '@/store/slices/global';
import BigNumber from 'bignumber.js';
import { BN } from '@/utils/BigNumber';
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

type TQuotaSP = {
  name: string;
  freeQuota: string;
  operatorAddress: string;
}
const DEFAULT_GAS_FEE = '0.000006';
const DEFAULT_GAS_LIMIT = 1200;
const DEFAULT_TX_TYPE = MsgCreateObjectTypeUrl;
export const PriceCalculator = () => {
  const [storeParams, setStoreParams] = useState({} as TStoreFeeParams);
  const [bnbPrice, setBnbPrice] = useState('0');
  const [sps, setSps] = useState<TQuotaSP[]>([]);
  const [gasFee, setGasFee] = useState(DEFAULT_GAS_FEE);
  useAsyncEffect(async () => {
    const curTime = getTimestampInSeconds();
    const latestStoreParams = await getStoreFeeParams(curTime);
    setStoreParams(latestStoreParams);
    const bnbPrice = await getBnbPrice();
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
        freeQuota: String(keySpMeta[item.operatorAddress].FreeReadQuota || ''),
      }
    })
    setSps(fullSps);
  }, []);

  return (
    <Flex gap={40} flexDirection={'column'} bgColor={'#fff'}>
      <Flex
        paddingTop={64}
        bg={`center/cover no-repeat url(${assetPrefix}/images/price/bg.svg)`}
        flexDirection={'column'}
      >
        <Banner />
        <Calculator storeParams={storeParams} bnbPrice={bnbPrice} gasFee={gasFee} />
      </Flex>
      <PricingCard storeParams={storeParams} />
      <SPFreeQuota sps={sps} />
      <FAQ />
      <StartBuild />
    </Flex>
  );
};
