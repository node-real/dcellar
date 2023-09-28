import { Flex, Link } from '@totejs/uikit';
import { Logo } from '../Logo';
import { GAClick } from '@/components/common/GATracker';
import { ExternalLinkIcon, IconProps } from '@totejs/icons';
import { ConnectWallet } from '@/components/ConnectWallet';
import { useRouter } from 'next/router';
import { IconFont } from '@/components/IconFont';

export const MENUS = [
  {
    title: 'Homepage',
    link: '/',
    target: '',
    Icon: () => <></>,
    gaName: 'dc_lp.main.header.homepage.click',
  },
  {
    title: 'Pricing',
    link: '/pricing-calculator',
    target: '',
    Icon: () => <></>,
    gaName: 'dc_lp.main.header.pricing.click',
  },
  {
    title: 'Docs',
    link: '#',
    target: '_blank',
    Icon: (props: IconProps) => <ExternalLinkIcon w={12} ml={2} mt={-1} {...props} />,
    gaName: 'dc_lp.main.header.docs.click',
  },
];

export const BaseHeader = () => {
  const router = useRouter();
  const gaClickName = getGAOptions(router.pathname);

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
      <GAClick name="dc_lp.main.header.logo.click">
        <Logo href="/buckets" />
      </GAClick>
      <Flex gap={32}>
        {MENUS.map((item, index) => (
          <GAClick name={item.gaName} key={index}>
            <Link
              color={router.pathname === item.link ? 'brand.brand6' : 'readable.normal'}
              href={item.link}
              target={item.target}
            >
              {item.title}
              <item.Icon />
            </Link>
          </GAClick>
        ))}
      </Flex>
      <ConnectWallet
        h={36}
        p={'10px 16px'}
        fontWeight={500}
        fontSize={14}
        gaClickName={gaClickName}
        icon={<IconFont type={'wallet-filled'} w={24} />}
        text="Connect wallet"
        variant="ghost"
        border={'1px solid readable.border'}
        _hover={{
          color: 'brand.brand6',
          border: '1px solid brand.brand6',
        }}
      />
    </Flex>
  );
};

function getGAOptions(pathname: string) {
  switch (true) {
    case pathname === '/pricing-calculator':
      return 'dc_lp.calculator.dcellar.connect_wallet.click';
    default:
      return 'dc_lp.main.header.connect_wallet.click';
  }
}
