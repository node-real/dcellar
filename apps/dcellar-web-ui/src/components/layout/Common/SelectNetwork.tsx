import { runtimeEnv } from '@/base/env';
import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { DCMenu } from '@/components/common/DCMenu';
import { MenuOption } from '@/components/common/DCMenuList';
import { InternalRoutePaths } from '@/constants/paths';
import { capitalizeFLetter } from '@/utils/common';
import { ButtonProps, MenuButton } from '@node-real/uikit';
import { useRouter } from 'next/router';

interface TNetwork extends MenuOption {
  label: string;
  value: string;
  domain: string;
}

type SelectNetworkProps = {
  buttonStyles?: ButtonProps;
};

const networks: TNetwork[] = [
  {
    label: 'Mainnet',
    value: 'mainnet',
    domain: 'https://dcellar.io',
  },
  {
    label: 'Testnet',
    value: 'testnet',
    domain: 'https://testnet.dcellar.io',
  },
];

export const GO_ROOT_PATHS: { [key: string]: string } = {
  '/buckets': InternalRoutePaths.buckets,
  '/buckets/[...path]': InternalRoutePaths.accounts,
  '/accounts': InternalRoutePaths.accounts,
  '/accounts/[address]': InternalRoutePaths.accounts,
};

export const SelectNetwork = ({ buttonStyles = {} }: SelectNetworkProps) => {
  const router = useRouter();

  const selected = ['mainnet', 'testnet'].includes(runtimeEnv) ? runtimeEnv : 'testnet';

  const onItemClick = (net: TNetwork) => {
    if (runtimeEnv === net.value) {
      return;
    }
    const rootPath = GO_ROOT_PATHS[router.pathname];
    window.location.href = rootPath ? `${net.domain}${rootPath}` : `${net.domain}${router.asPath}`;
  };

  return (
    <DCMenu
      strategy={'fixed'}
      zIndex={1400}
      selectIcon
      value={selected}
      options={networks}
      onMenuSelect={(v) => onItemClick(v as TNetwork)}
    >
      {({ isOpen }) => (
        <MenuButton
          as={DCButton}
          h={32}
          bgColor={'bg.middle'}
          padding={'8px 8px 8px 12px'}
          border={'1px solid readable.border'}
          borderRadius={24}
          color={'readable.normal'}
          fontSize={14}
          fontWeight={500}
          gap={4}
          _hover={{
            bgColor: '#fafafa',
          }}
          {...buttonStyles}
        >
          {capitalizeFLetter(selected)}
          <IconFont w={16} type={isOpen ? 'menu-open' : 'menu-close'} />
        </MenuButton>
      )}
    </DCMenu>
  );
};
