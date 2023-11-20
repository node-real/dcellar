import { smMedia } from '@/modules/responsive';
import { IconProps, MenuCloseIcon, MenuOpenIcon } from '@totejs/icons';
import { Button, ButtonProps, Menu, MenuButton, MenuItem, MenuList } from '@totejs/uikit';

type Props = {
  value: string;
  sizes: string[];
  onItemClick: (item: string) => void;
  buttonStyles?: ButtonProps;
  iconStyles?: IconProps;
};

export const SizeMenu = ({
  value,
  sizes,
  onItemClick,
  buttonStyles = {},
  iconStyles = {},
}: Props) => {
  return (
    <Menu>
      {({ isOpen }) => (
        <>
          <MenuButton
            as={Button}
            h={44}
            w={80}
            borderRadius={4}
            color={'readable.normal'}
            bgColor={'bg.bottom'}
            _hover={{
              bg: 'bg.secondary',
              border: '1px solid brand.brand5',
            }}
            _expanded={{
              border: '1px solid brand.brand5'
            }}
            sx={{
              [smMedia]: {
                w: '60px',
                h: '33px',
                fontSize: '14px',
              },
            }}
            rightIcon={
              isOpen ? (
                <MenuOpenIcon pointerEvents={'none'} color="readable.normal" {...iconStyles} />
              ) : (
                <MenuCloseIcon pointerEvents={'none'} color="readable.normal" {...iconStyles} />
              )
            }
            {...buttonStyles}
          >
            {value}
          </MenuButton>
          <MenuList borderRadius={4}>
            {sizes.map((item) => (
              <MenuItem
                w={80}
                key={item}
                onClick={() => {
                  onItemClick(item);
                }}
              >
                {item}
              </MenuItem>
            ))}
          </MenuList>
        </>
      )}
    </Menu>
  );
};
