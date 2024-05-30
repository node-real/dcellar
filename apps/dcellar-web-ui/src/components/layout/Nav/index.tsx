import { IconFont } from '@/components/IconFont';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, Flex, Text, Tooltip } from '@node-real/uikit';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { memo } from 'react';

const MENU_ITEMS = [
  {
    icon: 'dashboard-menu',
    text: 'Dashboard',
    trackId: 'dc.main.nav.dashboard.click',
  },
  {
    icon: 'bucket',
    text: 'Buckets',
    trackId: 'dc.main.nav.bucket.click',
  },
  {
    icon: 'group',
    text: 'Groups',
    trackId: 'dc.main.nav.groups.click',
  },
  {
    icon: 'wallet',
    text: 'Wallet',
    trackId: 'dc.main.nav.wallet.click',
  },
  {
    icon: 'account',
    text: 'Accounts',
    trackId: 'dc.main.nav.accounts.click',
  },
  {
    icon: 'toolbox',
    text: 'Toolbox',
    trackId: 'dc.main.nav.toolbox.click',
  },
];

const ASIDE = [
  {
    link: 'https://docs.bnbchain.org/bnb-greenfield/',
    trackId: 'dc.main.nav.doc.click',
    icon: 'book',
    text: 'BNB Greenfield Docs',
  },
  {
    link: 'https://docs.bnbchain.org/bnb-greenfield/for-developers/network-endpoint/endpoints/?h=rpc',
    trackId: 'dc.main.nav.release_note.click',
    icon: 'doc',
    text: 'Release Notes',
  },
  {
    link: 'https://discord.com/invite/bnbchain',
    trackId: 'dc.main.nav.discord.click',
    icon: 'discord',
    text: 'Discord',
  },
  {
    link: 'https://docs.nodereal.io/docs/dcellar-get-started',
    trackId: 'dc.main.nav.faq.click',
    icon: 'help',
    text: 'About DCellar',
  },
];

interface NavProps {}

export const Nav = memo<NavProps>(function Nav() {
  const { pathname } = useRouter();

  return (
    <NavContainer>
      <MenuList>
        {MENU_ITEMS.map((menu) => {
          const link = `/${menu.text.toLowerCase()}`;
          const active = pathname.startsWith(link);
          const icon = `${menu.icon}${active ? '-filled' : ''}`;
          return (
            <MenuItem key={menu.text} $active={active}>
              <Link href={link} data-track-id={menu.trackId} replace>
                <MenuIcon as="span">
                  <IconFont type={icon} />
                </MenuIcon>
                <MenuText as="span">{menu.text}</MenuText>
              </Link>
            </MenuItem>
          );
        })}
      </MenuList>
      <Flex
        justifyContent={'space-around'}
        padding={'12px 30px'}
        borderTop={'1px solid readable.border'}
      >
        {ASIDE.map((menu) => (
          <Tooltip key={menu.text} content={menu.text}>
            <Flex
              key={menu.text}
              width={32}
              height={32}
              borderRadius={16}
              justifyContent={'center'}
              alignItems={'center'}
              border={'1px solid readable.border'}
              _hover={{
                borderColor: 'brand.brand6',
                color: 'brand.brand6',
                svg: {
                  color: 'brand.brand6',
                },
              }}
            >
              <Link href={menu.link} data-track-id={menu.trackId} target="_blank">
                <MenuIcon as="span">
                  <IconFont type={menu.icon} />
                </MenuIcon>
              </Link>
            </Flex>
          </Tooltip>
        ))}
      </Flex>
    </NavContainer>
  );
});

const NavContainer = styled(Box)`
  display: grid;
  grid-template-rows: 1fr auto;
  height: 100%;
`;

const MenuList = styled.ul`
  display: grid;
  padding: 16px 0;
  gap: 16px;
  grid-template-rows: repeat(auto-fill, 40px);
  :last-child {
    border-top: 1px solid var(--ui-colors-readable-border);
  }
`;

const MenuItem = styled.li<{ $active?: boolean }>`
  position: relative;
  font-weight: 500;
  transition: all 0.15s;
  list-style-type: none;
  a {
    display: grid;
    gap: 12px;
    padding: 8px 12px;
    grid-template-columns: auto 1fr;
    align-items: center;
  }

  ${(props) =>
    props.$active
      ? css`
          z-index: 1;
          color: var(--ui-colors-brand-normal-hight);
          border-right: 3px solid var(--ui-colors-brand-normal);
          background: rgba(0, 186, 52, 0.1);
          ${MenuIcon} {
            color: var(--ui-colors-brand-normal-hight);
          }
        `
      : css`
          :hover {
            background: var(--ui-colors-bg-bottom);
          }
        `}}
`;

const MenuIcon = styled(Text)`
  font-size: 24px;
  color: var(--ui-colors-readable-secondary);
`;

const MenuText = styled(Text)`
  font-size: 16px;
`;
