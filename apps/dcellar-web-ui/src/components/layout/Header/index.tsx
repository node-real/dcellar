import { Box, Flex, Grid, Link } from '@totejs/uikit';
import React, { memo } from 'react';
import { TaskManagement } from '@/modules/upload/TaskManagement';
import styled from '@emotion/styled';
import { IconFont } from '@/components/IconFont';
import { AccountInfo } from '@/components/layout/Header/AccountInfo';
import { SelectNetwork } from '../Common/SelectNetwork';

interface HeaderProps {
  taskManagement?: boolean;
}

export const Header = memo<HeaderProps>(function Header({ taskManagement = true }) {
  return (
    <>
      <HeaderContainer>
        <LogoContainer>
          <Link href="/buckets" data-track-id="dc.main.nav.logo.click">
            <IconFont type="logo" w={122} h={24} />
          </Link>
          <Badge>Testnet</Badge>
        </LogoContainer>
        <Content>
          {taskManagement && (
            <>
              <TaskManagement />
              <Box w={1} h={44} bg={'readable.border'} />
            </>
          )}
          {
            <Box paddingX={16} borderLeft={taskManagement ? '1px solid readable.border' : 'none'}>
              <SelectNetwork />
            </Box>
          }
          <AccountInfo />
        </Content>
      </HeaderContainer>
    </>
  );
});

const HeaderContainer = styled(Grid)`
  grid-template-columns: max-content 1fr;
  padding: 10px 12px;
  align-items: center;
  gap: 70px;
  border-bottom: 1px solid var(--ui-colors-readable-border);
`;

const LogoContainer = styled(Flex)`
  align-items: center;
  gap: 8px;
`;

const Content = styled(Flex)`
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
`;

const Badge = styled.span`
  display: inline-flex;
  border-radius: 2px;
  color: var(--ui-colors-brand-normal-hight);
  background-color: var(--ui-colors-scene-success-opacity-normal);
  padding: 3px 4px;
  font-size: 12px;
  transform: scale(0.83333);
  margin-left: -3px;
`;
