import React from 'react';
import { Tabs, TabList, Tab, TabPanels, TabPanel, Text, Box } from '@totejs/uikit';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import queryString from 'query-string';

import { TransferIn } from './TransferIn';
import { TransferOut } from './TransferOut';
import { Send } from './Send';
import { EOperation } from './type';
import { GET_BALANCE_INTERVAL_MS, OperationTypes, POPPINS_FONT } from './constants';
import { getBnbPrice } from '../service';
import { WalletBalanceProvider } from '@/context/GlobalContext/WalletBalanceContext';
import { GAClick } from '@/components/common/GATracker';

type TWalletContext = {
  type: EOperation;
  bnbPrice: {
    value: string | undefined;
    symbol: string | undefined;
    isLoading: boolean;
    isError: boolean;
  };
};

export const OperationTypeContext = React.createContext<TWalletContext>({
  type: EOperation.transfer_in,
  bnbPrice: {},
} as TWalletContext);

export const Wallet = () => {
  const [operationType, setOperationType] = useState<EOperation>();
  const router = useRouter();
  // router.query has no value within a short period of time at the start of rendering
  const query = queryString.parse(queryString.extract(router.asPath));
  const type = query.type as EOperation | undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['getBnbPrice'],
    queryFn: getBnbPrice,
    refetchInterval: GET_BALANCE_INTERVAL_MS,
  });

  const onChange = (key: string) => {
    const url = `/wallet?type=${key}`;
    router.replace(url);
  };
  useEffect(() => {
    if (type && OperationTypes.includes(type)) {
      setOperationType(type);
      return;
    }
    if (!type) {
      setOperationType(EOperation.transfer_in);
      return;
    }
  }, [type]);

  const ContextVals = {
    type: operationType,
    bnbPrice: {
      value: data?.price,
      symbol: data?.symbol,
      isLoading: isLoading,
      isError: isError,
    },
  } as TWalletContext;

  return (
    <WalletBalanceProvider>
      <OperationTypeContext.Provider value={ContextVals}>
        <Box p={'24px'} flex="1">
          <Text
            as={'h1'}
            fontWeight="700"
            fontSize={'24px'}
            lineHeight="36px"
            fontFamily={POPPINS_FONT}
          >
            Wallet
          </Text>
          <Tabs activeKey={operationType} onChange={(key) => onChange(key.toString())}>
            <TabList
              gap={'97px'}
              _selected={{
                fontWeight: '600',
              }}
              borderBottom="2px solid readable.border !important"
            >
              <GAClick name="dc.wallet.tab.transferin.click">
                <Tab
                  width={'90px'}
                  textAlign="center"
                  fontFamily={POPPINS_FONT}
                  tabKey={EOperation.transfer_in}
                  borderBottom={'4px solid transparent'}
                  marginBottom={'-2px'}
                  _hover={{
                    fontWeight: '600',
                    borderBottom: '4px solid readable.brand6',
                  }}
                  _selected={{
                    fontWeight: '600',
                    borderBottom: '4px solid readable.brand6',
                  }}
                >
                  Transfer In
                </Tab>
              </GAClick>
              <GAClick name="dc.wallet.tab.transferout.click">
                <Tab
                  fontFamily={POPPINS_FONT}
                  tabKey={EOperation.transfer_out}
                  textAlign="center"
                  width="105px"
                  marginBottom={'-2px'}
                  borderBottom={'4px solid transparent'}
                  _hover={{
                    fontWeight: '600',
                    borderBottom: '4px solid readable.brand6',
                  }}
                  _selected={{
                    fontWeight: '600',
                    borderBottom: '4px solid readable.brand6',
                  }}
                >
                  Transfer Out
                </Tab>
              </GAClick>
              <GAClick name="dc.wallet.tab.send.click">
                <Tab
                  fontFamily={POPPINS_FONT}
                  tabKey={EOperation.send}
                  textAlign="center"
                  width="45px"
                  marginBottom={'-2px'}
                  borderBottom={'4px solid transparent'}
                  _hover={{
                    fontWeight: '600',
                    borderBottom: '4px solid readable.brand6',
                  }}
                  _selected={{
                    fontWeight: '600',
                    borderBottom: '4px solid readable.brand6',
                  }}
                >
                  Send
                </Tab>
              </GAClick>
            </TabList>
            <TabPanels>
              <TabPanel panelKey={EOperation.transfer_in} p={'32px 32px 0'}>
                <TransferIn />
              </TabPanel>
              <TabPanel panelKey={EOperation.transfer_out} p={'32px 32px 0'}>
                <TransferOut />
              </TabPanel>
              <TabPanel panelKey={EOperation.send} p={'32px 32px 0'}>
                <Send />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </OperationTypeContext.Provider>
    </WalletBalanceProvider>
  );
};
