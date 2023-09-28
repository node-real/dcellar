
import { MenuCloseIcon, MenuOpenIcon } from '@totejs/icons';
import { Button, ButtonProps, Menu, MenuButton, MenuItem, MenuList } from '@totejs/uikit';
import React from 'react'

type Props = {
  value: string;
  sizes: string[];
  onItemClick: (item: string) => void;
  buttonStyles?: ButtonProps;
}

export const SizeMenu = ({value, sizes, onItemClick, buttonStyles = {}}: Props)=> {
  return (
    <Menu>
    {({ isOpen }) => (
      <>
        <MenuButton
          isActive={isOpen}
          as={Button}
          h={44}
          w={80}
          color={'readable.normal'}
          bgColor={'bg.bottom'}
          _hover={{
            bg: 'bg.secondary',
          }}
          rightIcon={
            isOpen ? (
              <MenuOpenIcon pointerEvents={'none'} color="readable.normal" />
            ) : (
              <MenuCloseIcon pointerEvents={'none'} color="readable.normal" />
            )
          }
          {...buttonStyles}
        >
          {value}
        </MenuButton>
        <MenuList>
          {sizes.map((item) => (
            <MenuItem
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
  )
}
