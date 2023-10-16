import { runtimeEnv } from '@/base/env';
import { capitalizeFLetter } from '@/utils/common';
import { ButtonProps, MenuButton } from '@totejs/uikit';
import { useRouter } from 'next/router';
import { DCMenu } from '@/components/common/DCMenu';
import { MenuOption } from '@/components/common/DCMenuList';
import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { InternalRoutePaths } from '@/utils/constant';

interface TNetwork extends MenuOption {
  label: string;
  value: string;
  domain: string;
}

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
type SelectNetworkProps = {
  buttonStyles?: ButtonProps;
};
export const SelectNetwork = ({ buttonStyles = {} }: SelectNetworkProps) => {
  const router = useRouter();
  const selected = ['mainnet', 'testnet'].includes(runtimeEnv) ? runtimeEnv : 'testnet';
  const onItemClick = (net: TNetwork) => {
    if (runtimeEnv === net.value) {
      return;
    }
    const isBucketsPath = router.pathname.includes(InternalRoutePaths.buckets);
    window.location.href = isBucketsPath
      ? `${net.domain}${InternalRoutePaths.buckets}`
      : `${net.domain}${router.asPath}`;
  };

  return (
    <DCMenu
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
