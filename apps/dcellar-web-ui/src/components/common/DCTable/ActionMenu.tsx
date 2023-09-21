import React, { memo } from 'react';
import { Flex, Menu, MenuButton, MenuItem, MenuList } from '@totejs/uikit';
import { GAClick, GAShow } from '@/components/common/GATracker';
import styled from '@emotion/styled';
import { transientOptions } from '@/utils/transientOptions';
import { isEmpty } from 'lodash-es';
import { ActionButton } from './ActionButton';
import { IconFont } from '@/components/IconFont';

export type ActionMenuItem = { label: string; value: string; disabled?: boolean };

interface ActionMenuProps {
  onChange?: (menu: string) => void;
  menus: Array<ActionMenuItem>;
  operations?: string[];
  justifyContent?: string;
}

export const ActionMenu = memo<ActionMenuProps>(function ActionMenu({
  onChange = () => {},
  operations = [],
  menus = [],
  justifyContent,
}) {
  if (isEmpty(menus)) return null;
  return (
    <Flex justifyContent={justifyContent || 'center'}>
      {operations.map((m) => {
        switch (m) {
          case 'add':
            return (
              <ActionButton
                key={m}
                gaClickName="dc.group.add_member.0.click"
                marginRight={'8px'}
                onClick={() => onChange(m)}
                tip="Add Members"
              >
                <IconFont type="add-member" w={20} color={'brand.brand6'} />
              </ActionButton>
            );
          case 'download':
            return (
              <ActionButton
                key={m}
                title="Download"
                gaClickName="dc.file.download_btn.0.click"
                marginRight={'8px'}
                tip="Download"
                onClick={() => onChange(m)}
              >
                <IconFont type="download" w={20} color={'brand.brand6'} />
              </ActionButton>
            );
          case 'share':
            return (
              <ActionButton
                marginRight={'8px'}
                key={m}
                tip="Share"
                gaClickName="dc.file.share_btn.0.click"
                onClick={() => onChange(m)}
              >
                <IconFont type="share" w={24} color={'brand.brand6'} />
              </ActionButton>
            );
          // owner account list
          case 'transfer_in':
            return (
              <ActionButton
                key={m}
                tip="Transfer In"
                gaClickName="dc.accounts.transfer_in_btn.0.click"
                marginRight={'8px'}
                onClick={() => onChange(m)}
              >
                <IconFont type="in" w={20} color={'brand.brand6'} />
              </ActionButton>
            );
          case 'transfer_out':
            return (
              <ActionButton
                key={m}
                tip="Transfer Out"
                gaClickName="dc.accounts.owner_account.transfer_out_btn.0.click"
                marginRight={'8px'}
                onClick={() => onChange(m)}
              >
                <IconFont type="out" w={20} color={'brand.brand6'} />
              </ActionButton>
            );
          case 'send':
            return (
              <ActionButton
                key={m}
                tip="Send"
                gaClickName="dc.accounts.owner_account.send_btn.0.click"
                marginRight={'8px'}
                onClick={() => onChange(m)}
              >
                <IconFont type="send" w={20} color={'brand.brand6'} />
              </ActionButton>
            );
          // payment account list
          case 'deposit':
            return (
              <ActionButton
                key={m}
                tip="Deposit"
                gaClickName="dc.accounts.payment_account.deposit_btn.0.click"
                marginRight={'8px'}
                onClick={() => onChange(m)}
              >
                <IconFont type="deposit" w={20} color={'brand.brand6'} />
              </ActionButton>
            );
          case 'withdraw':
            return (
              <ActionButton
                key={m}
                tip="Withdraw"
                gaClickName="dc.accounts.payment_account.withdraw_btn.0.click"
                marginRight={'8px'}
                onClick={() => onChange(m)}
              >
                <IconFont type="withdraw" w={20} color={'brand.brand6'} />
              </ActionButton>
            );
        }
      })}
      <Menu placement="bottom-end" trigger="hover" strategy="fixed">
        {({ isOpen }) => (
          <>
            <StyledMenuButton $open={isOpen} onClick={(e) => e.stopPropagation()}>
              <IconFont w={20} type="dots-v" mx={2} />
            </StyledMenuButton>
            <MenuList>
              <GAShow name="dc.bucket.list_menu.0.show" isShow={isOpen} />
              {menus.map((m) => (
                <GAClick key={m.value} name={`dc.bucket.list_menu.${m.value}.click`}>
                  <StyledMenuItem
                    isDisabled={m.disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(m.value);
                    }}
                  >
                    {m.label}
                  </StyledMenuItem>
                </GAClick>
              ))}
            </MenuList>
          </>
        )}
      </Menu>
    </Flex>
  );
});

export const StyledMenuButton = styled(MenuButton, transientOptions)<{ $open?: boolean }>`
  border-radius: 100%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  transition: all 0.1s;

  :hover {
    background-color: rgba(0, 186, 52, 0.2);
    color: #00ba34;
  }

  background-color: ${(props) => (props.$open ? 'rgba(0, 186, 52, 0.1)' : 'transparent')};
  color: ${(props) => (props.$open ? '#00BA34' : '#1E2026')};
`;

export const StyledMenuItem = styled(MenuItem)`
  :hover {
    color: ${(props) => !props.isDisabled && '#009e2c'};
    background-color: rgba(0, 186, 52, 0.1);
  }
`;
