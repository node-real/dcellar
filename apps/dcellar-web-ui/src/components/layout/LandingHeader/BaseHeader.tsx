import { Badge, Box, Flex, Link } from '@totejs/uikit';
import NextLink from 'next/link';
import { Logo } from '../Logo';
import { GAClick } from '@/components/common/GATracker';
import { ExternalLinkIcon, IconProps } from '@totejs/icons';
import { ConnectWallet } from '@/components/ConnectWallet';
import { useRouter } from 'next/router';
import { IconFont } from '@/components/IconFont';
import { useDetectScroll } from './useDetectScroll';
import { SelectNetwork } from '../Common/SelectNetwork';
import { networkTag } from '@/utils/common';
import { runtimeEnv } from '@/base/env';

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
    link: 'https://docs.nodereal.io/docs/dcellar-get-started',
    target: '_blank',
    Icon: (props: IconProps) => <ExternalLinkIcon w={12} ml={2} mt={-1} {...props} />,
    gaName: 'dc_lp.main.header.docs.click',
  },
];

export const BaseHeader = () => {
  const router = useRouter();
  const gaClickName = getGAOptions(router.pathname);
  const isScroll = useDetectScroll();
  return (
    <Flex
      as="header"
      width={'100%'}
      h={64}
      paddingX="40px"
      alignItems="center"
      justifyContent={'space-between'}
      position={'fixed'}
      zIndex={1100}
      backdropFilter={'blur(10px)'}
      boxShadow={isScroll ? '0px 4px 24px 0px rgba(0, 0, 0, 0.08)' : 'none'}
      background={isScroll ? 'opacity11' : 'transparent'}
    >
      <GAClick name="dc_lp.main.header.logo.click">
        <Flex alignItems={'center'}>
          <Logo href="/" />
          {runtimeEnv === 'testnet' && (
            <Badge
              borderRadius={2}
              color={'brand.brand7'}
              padding={'3px 4px'}
              fontSize={12}
              transform={'scale(0.83333)'}
              bgColor={'opacity1'}
            >
              {networkTag(runtimeEnv)}
            </Badge>
          )}
        </Flex>
      </GAClick>
      <Flex
        gap={32}
        position={'absolute'}
        top={'50%'}
        left={'50%'}
        transform={'translate(-50%, -50%)'}
      >
        {MENUS.map((item, index) => (
          <NextLink key={index} href={item.link} passHref legacyBehavior>
            <Link
              color={router.pathname === item.link ? 'brand.brand6' : 'readable.normal'}
              target={item.target}
            >
              <GAClick name={item.gaName}>
                <Box display="contents">
                  {item.title}
                  <item.Icon />
                </Box>
              </GAClick>
            </Link>
          </NextLink>
        ))}
      </Flex>
      <Flex alignItems={'center'} gap={16}>
        <SelectNetwork buttonStyles={{ h: 40, background: 'transparent' }} />
        <ConnectWallet
          h={40}
          p={'10px 16px'}
          fontWeight={500}
          fontSize={14}
          gaClickName={gaClickName}
          icon={<IconFont type={'wallet-filled'} w={24} />}
          text="Get Started"
          variant="ghost"
          border={'1px solid readable.border'}
          _hover={{
            color: 'brand.brand6',
            border: '1px solid brand.brand6',
          }}
        />
      </Flex>
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
