import { Box, Text, Flex, IconButtonProps, Link } from '@totejs/uikit';
import { Logo } from '../Logo';
import { GAClick } from '@/components/common/GATracker';
import { ExternalLinkIcon, IconProps, WalletIcon } from '@totejs/icons';
import { DCButton } from '@/components/common/DCButton';
import WalletFilledIcon from '@/public/images/icons/wallet-filled.svg';
import { ConnectWallet } from '@/components/ConnectWallet';

export const MENUS = [
  {
    title: 'Homepage',
    link: '/',
    target: '',
    Icon: () => <></>,
  },
  {
    title: 'Pricing',
    link: '/price-calculator',
    target: '',
    Icon: () => <></>,
  },
  {
    title: 'Docs',
    link: '#',
    target: '_blank',
    Icon: (props: IconProps) => <ExternalLinkIcon w={12} ml={2} mt={-1} {...props} />,
  },
];

export const BaseHeader = () => {
  return (
    <Flex
      as="header"
      width={'100%'}
      h={64}
      paddingX="40px"
      alignItems="center"
      justifyContent={'space-between'}
      bg={'transparent'}
      position={'fixed'}
      zIndex={1100}
      backdropFilter={'blur(10px)'}
    >
      <GAClick name="dc.main.nav.logo.click">
        <Logo href="/buckets" />
      </GAClick>
      <Flex gap={32}>
        {MENUS.map((item) => (
          <Link color={'readable.normal'} key={item.title} href={item.link} target={item.target}>
            {item.title}
            <item.Icon/>
          </Link>
        ))}
      </Flex>
      <ConnectWallet h={36} p={'10px 16px'} fontWeight={500} fontSize={14}/>
      {/* <DCButton h={36} p={'10px 16px'} variant="dcGhost">
        <WalletFilledIcon w={24} h={24} color={'readable.normal'} />
        <Text marginLeft={4}>Get Started</Text>
      </DCButton> */}
    </Flex>
  );
};
