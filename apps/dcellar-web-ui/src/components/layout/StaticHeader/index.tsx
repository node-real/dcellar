import { Box, Text, Flex, IconButtonProps, Link } from '@totejs/uikit';
import { Logo } from '../Logo';
import { GAClick } from '@/components/common/GATracker';
import { ExternalLinkIcon, IconProps, WalletIcon } from '@totejs/icons';
import { DCButton } from '@/components/common/DCButton';
import WalletFilledIcon from '@/public/images/icons/wallet-filled.svg';

const DEFAULT_MENU_OPTIONS = [
  {
    title: 'Homepage',
    link: '/',
    target: '',
    icon: null
  },
  {
    title: 'Pricing',
    link: '/pricecalculator',
    target: '',
    icon: null
  },
  {
    title: 'Docs',
    link: '#',
    target: '_blank',
    icon: <ExternalLinkIcon w={12} ml={2} mt={-1}/>
  },
];
export const StaticHeader = () => {
  return (
    <Flex as="header" width={'100%'} h={64} paddingX="40px" alignItems="center" justifyContent={'space-between'} bg={'transparent'} position={'fixed'}>
      <GAClick name="dc.main.nav.logo.click">
        <Logo href="/buckets" />
      </GAClick>
      <Flex gap={32}>
        {DEFAULT_MENU_OPTIONS.map((item) => (
          <Link color={'readable.normal'} key={item.title} href={item.link} target={item.target}>
            {item.title}
            {item.icon}
          </Link>
        ))}
      </Flex>
      <DCButton h={36} p={'10px 16px'} variant='dcGhost'>
        <WalletFilledIcon w={24} h={24} color={'readable.normal'} />
        <Text marginLeft={4}>Get Started</Text>
      </DCButton>
    </Flex>
  );
};
