import React from 'react';
import { Box, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@totejs/uikit';
import { useRouter } from 'next/router';

import { TransferIn } from './TransferIn';
import { TransferOut } from './TransferOut';
import { Send } from './Send';
import { EOperation } from './type';
import { INTER_FONT, POPPINS_FONT } from './constants';
import { WalletBalanceProvider } from '@/context/GlobalContext/WalletBalanceContext';
import { GAClick } from '@/components/common/GATracker';
import { useAppSelector } from '@/store';

export const Wallet = () => {
  const { transType } = useAppSelector((root) => root.wallet);
  const router = useRouter();

  const onChange = (key: string) => {
    const url = `/wallet?type=${key}`;
    router.replace(url, undefined, { shallow: true });
  };

  return (
    <WalletBalanceProvider>
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
        <Tabs activeKey={transType} onChange={(key) => onChange(key.toString())}>
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
                fontFamily={INTER_FONT}
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
                fontFamily={INTER_FONT}
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
                fontFamily={INTER_FONT}
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
    </WalletBalanceProvider>
  );
};
