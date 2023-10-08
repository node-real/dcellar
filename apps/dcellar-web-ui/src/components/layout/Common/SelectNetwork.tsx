import { runtimeEnv } from '@/base/env';
import { capitalizeFLetter } from '@/utils/common';
import { MenuCloseIcon, MenuOpenIcon } from '@totejs/icons';
import { Box, Button, Menu, MenuButton, MenuItem, MenuList, Portal, Text } from '@totejs/uikit';
import { useRouter } from 'next/router';
import SelectedIcon from '@/public/images/files/icons/selected.svg';

type TNetwork = {
  title: string;
  id: string;
  domain: string;
};
const networks: TNetwork[] = [
  {
    title: 'Mainnet',
    id: 'mainnet',
    domain: 'https://dcellar.io',
  },
  {
    title: 'Testnet',
    id: 'testnet',
    domain: 'https://testnet.dcellar.io',
  },
];

export const SelectNetwork = () => {
  const router = useRouter();
  const selected = ['mainnet', 'testnet'].includes(runtimeEnv) ? runtimeEnv : 'testnet';
  const onItemClick = (net: TNetwork) => {
    if (runtimeEnv === net.id) {
      return;
    }
    const url = `${net.domain}${router.asPath}`;
    window.open(url, '_blank');
  };
  return (
    <Menu strategy="fixed">
      {({ isOpen }) => (
        <>
          <MenuButton
            isActive={isOpen}
            as={Button}
            h={32}
            bgColor={'bg.bottom'}
            padding={'8px 8px 8px 12px'}
            border={'1px solid readable.border'}
            borderRadius={24}
            color={'readable.normal'}
            fontSize={14}
            fontWeight={500}
            rightIcon={
              isOpen ? (
                <MenuOpenIcon pointerEvents={'none'} />
              ) : (
                <MenuCloseIcon pointerEvents={'none'} />
              )
            }
            _hover={{
              bgColor: 'bg.secondary',
            }}
          >
            {capitalizeFLetter(selected)}
          </MenuButton>
          <Portal>
            <MenuList>
              {networks.map((item, index) => (
                <MenuItem
                  padding={'8px 16px 8px 8px'}
                  key={index}
                  onClick={() => onItemClick(item)}
                >
                  {selected === item.id ? <SelectedIcon /> : <Box w={16}></Box>}
                  <Text marginLeft={8}>{item.title}</Text>
                </MenuItem>
              ))}
            </MenuList>
          </Portal>
        </>
      )}
    </Menu>
  );
};
