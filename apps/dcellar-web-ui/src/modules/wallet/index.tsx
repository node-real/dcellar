import React, { memo } from 'react';
import { Box, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@totejs/uikit';
import { useRouter } from 'next/router';

import { TransferIn } from './TransferIn';
import { TransferOut } from './TransferOut';
import { Send } from './Send';
import { EOperation } from './type';
import { WalletBalanceProvider } from '@/context/GlobalContext/WalletBalanceContext';
import { GAClick } from '@/components/common/GATracker';
import { useAppSelector } from '@/store';
import styled from '@emotion/styled';

interface WalletProps {}

export const Wallet = memo<WalletProps>(function Wallet() {
  const { transType } = useAppSelector((root) => root.wallet);
  const router = useRouter();

  const onChange = (key: string) => {
    const url = `/wallet?type=${key}`;
    router.replace(url, undefined, { shallow: true });
  };

  return (
    <WalletBalanceProvider>
      <Container>
        <Box>
          <Text as={'h1'} fontWeight="700" fontSize={'24px'} mb={16}>
            Wallet
          </Text>
          <Tabs activeKey={transType} onChange={(key) => onChange(key.toString())}>
            <TabList gap={'24px'} borderBottom="1px solid readable.border !important">
              <GAClick name="dc.wallet.tab.transferin.click">
                <Tab tabKey={EOperation.transfer_in}>Transfer In</Tab>
              </GAClick>
              <GAClick name="dc.wallet.tab.transferout.click">
                <Tab tabKey={EOperation.transfer_out}>Transfer Out</Tab>
              </GAClick>
              <GAClick name="dc.wallet.tab.send.click">
                <Tab tabKey={EOperation.send}>Send</Tab>
              </GAClick>
            </TabList>
            <TabPanels>
              <TabPanel panelKey={EOperation.transfer_in} p="16px 32px 0 32px">
                <TransferIn />
              </TabPanel>
              <TabPanel panelKey={EOperation.transfer_out} p="16px 32px 0 32px">
                <TransferOut />
              </TabPanel>
              <TabPanel panelKey={EOperation.send} p="16px 32px 0 32px">
                <Send />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Container>
    </WalletBalanceProvider>
  );
});

const Container = styled(Box)`
  .ui-tabs-tab {
    font-weight: 500;
    height: 28px;
    line-height: normal;
    padding-bottom: 6px;
    border-bottom: 2px solid transparent;

    &[data-selected] {
      font-weight: 500;
      color: var(--ui-colors-scene-success-normal);
      border-bottom-color: var(--ui-colors-scene-success-normal);
    }

    &:hover {
      font-weight: 500;
      color: var(--ui-colors-scene-success-active);
      border-bottom-color: var(--ui-colors-scene-success-active);
    }
  }
`;
