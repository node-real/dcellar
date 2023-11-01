import { memo, PropsWithChildren } from 'react';
import styled from '@emotion/styled';
import { Grid } from '@totejs/uikit';
import { Header } from '@/components/layout/Header';
import { Nav } from '@/components/layout/Nav';

interface LayoutProps extends PropsWithChildren {}

export const Layout = memo<LayoutProps>(function Layout({ children }) {
  return (
    <LayoutContainer>
      <LayoutHeader>
        <Header />
      </LayoutHeader>
      <LayoutNav>
        <Nav />
      </LayoutNav>
      <Content id={'layout-main'}>{children}</Content>
    </LayoutContainer>
  );
});

const LayoutContainer = styled(Grid)`
  grid-template-areas:
    'Header Header'
    'Nav Content';
  grid-template-columns: auto 1fr;
`;

const LayoutHeader = styled.header`
  grid-area: Header;
  position: sticky;
  top: 0;
  max-width: 100%;
  z-index: 1001;
  height: 65px;
  background: var(--ui-colors-bg-middle);
`;

const LayoutNav = styled.nav`
  grid-area: Nav;
  position: sticky;
  top: 65px;
  overflow-y: auto;
  height: calc(100vh - 65px);
  width: 237px;
  background: #ffffff;
  :after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    width: 1px;
    background: var(--ui-colors-readable-border);
  }
`;

const Content = styled.main`
  grid-area: Content;
  background: var(--ui-colors-bg-middle);
  padding: 16px 24px;
  position: relative;
  z-index: 1;
`;
