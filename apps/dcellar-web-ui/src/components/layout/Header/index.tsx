import { runtimeEnv } from '@/base/env';
import { CookiePolicyContainer } from '@/components/CookiePolicyContainer';
import { IconFont } from '@/components/IconFont';
import { TaskManagement } from '@/modules/upload/TaskManagement';
import { networkTag } from '@/utils/common';
import styled from '@emotion/styled';
import { Box, Flex, Grid, Link } from '@node-real/uikit';
import { memo } from 'react';
import { SelectNetwork } from '../Common/SelectNetwork';
import { Account } from './Account';

interface HeaderProps {
  taskManagement?: boolean;
}

export const Header = memo<HeaderProps>(function Header({ taskManagement = true }) {
  return (
    <>
      <HeaderContainer>
        <LogoContainer>
          <Link href="/" target="_blank" data-track-id="dc.main.nav.logo.click">
            <IconFont type="logo" w={122} h={24} />
          </Link>
          {runtimeEnv === 'testnet' && <Badge>{networkTag(runtimeEnv)}</Badge>}
        </LogoContainer>
        <Content>
          {taskManagement && (
            <>
              <TaskManagement />
              <Box w={1} h={44} bg={'readable.border'} />
              <SelectNetwork />
            </>
          )}
          <Account />
        </Content>
        <CookiePolicyContainer />
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

export const Badge = styled.span`
  display: inline-flex;
  border-radius: 2px;
  color: var(--ui-colors-brand-brand7);
  background-color: var(--ui-colors-opacity1);
  padding: 3px 4px;
  font-size: 12px;
  transform: scale(0.83333);
  margin-left: -3px;
`;
