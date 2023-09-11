import React, { memo } from 'react';
import { Flex, Menu, MenuButton, MenuItem, MenuList } from '@totejs/uikit';
import MenuIcon from '@/public/images/icons/menu.svg';
import { GAClick, GAShow } from '@/components/common/GATracker';
import styled from '@emotion/styled';
import { transientOptions } from '@/utils/transientOptions';
import { isEmpty } from 'lodash-es';
import ShareIcon from '@/public/images/icons/share.svg';
import AddMember from '@/public/images/icons/add_member.svg';
import { DownloadIcon } from '@totejs/icons';
import TransferInIcon from '@/public/images/icons/transfer-in.svg';
import TransferOutIcon from '@/public/images/icons/transfer-out.svg';
import SendIcon from '@/public/images/icons/send.svg';
import DepositIcon from '@/public/images/icons/deposit.svg';
import WithdrawIcon from '@/public/images/icons/withdraw.svg';
import { ActionButton } from './ActionButton';

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
                title="Add"
              >
                <AddMember />
              </ActionButton>
            );
          case 'download':
            return (
              <ActionButton
                key={m}
                title="Download"
                gaClickName="dc.file.download_btn.0.click"
                marginRight={'8px'}
                onClick={() => onChange(m)}
              >
                <DownloadIcon size="md" color="readable.brand6" />
              </ActionButton>
            );
          case 'share':
            return (
              <ActionButton
                marginRight={'8px'}
                key={m}
                title="Share"
                gaClickName="dc.file.share_btn.0.click"
                onClick={() => onChange(m)}
              >
                <ShareIcon />
              </ActionButton>
            );
          // owner account list
          case 'transfer_in':
            return (
              <ActionButton
                key={m}
                title="Transfer In"
                gaClickName="dc.accounts.transfer_in_btn.0.click"
                marginRight={'8px'}
                onClick={() => onChange(m)}
              >
                <TransferInIcon color="#00BA34" />
              </ActionButton>
            );
          case 'transfer_out':
            return (
              <ActionButton
                key={m}
                title="Transfer Out"
                gaClickName="dc.accounts.owner_account.transfer_out_btn.0.click"
                marginRight={'8px'}
                onClick={() => onChange(m)}
              >
                <TransferOutIcon color="#00BA34" />
              </ActionButton>
            );
          case 'send':
            return (
              <ActionButton
                key={m}
                title="Send"
                gaClickName="dc.accounts.owner_account.send_btn.0.click"
                marginRight={'8px'}
                onClick={() => onChange(m)}
              >
                <SendIcon color="#00BA34" />
              </ActionButton>
            );
          // payment account list
          case 'deposit':
            return (
              <ActionButton
                key={m}
                title="Deposit"
                gaClickName="dc.accounts.payment_account.deposit_btn.0.click"
                marginRight={'8px'}
                onClick={() => onChange(m)}
              >
                <DepositIcon />
              </ActionButton>
            );
          case 'withdraw':
            return (
              <ActionButton
                key={m}
                title="Withdraw"
                gaClickName="dc.accounts.payment_account.withdraw_btn.0.click"
                marginRight={'8px'}
                onClick={() => onChange(m)}
              >
                <WithdrawIcon />
              </ActionButton>
            );
        }
      })}
      <Menu placement="bottom-end" trigger="hover" strategy="fixed">
        {({ isOpen }) => (
          <>
            <StyledMenuButton $open={isOpen} onClick={(e) => e.stopPropagation()}>
              <MenuIcon />
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
  :hover  {
    color: ${(props) => !props.isDisabled && '#009e2c'};
    background-color: rgba(0, 186, 52, 0.1);
  }
`;
