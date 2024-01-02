import React, { memo } from 'react';
import { Center, Flex, MenuButton } from '@totejs/uikit';
import styled from '@emotion/styled';
import { transientOptions } from '@/utils/css';
import { ActionButton } from './ActionButton';
import { IconFont } from '@/components/IconFont';
import { MenuOption } from '@/components/common/DCMenuList';
import { DCMenu } from '@/components/common/DCMenu';
import { css } from '@emotion/react';

const OPERATIONS: Record<string, { ga: string; tip: string; type: string; w: number }> = {
  add: { ga: 'dc.group.add_member.0.click', tip: 'Add Members', type: 'add-member', w: 20 },
  download: { ga: 'dc.file.download_btn.0.click', tip: 'Download', type: 'download', w: 20 },
  share: { ga: 'dc.file.share_btn.0.click', tip: 'Share', type: 'share', w: 24 },
  transfer_in: { ga: 'dc.accounts.transfer_in_btn.0.click', tip: 'Transfer In', type: 'in', w: 20 },
  transfer_out: {
    ga: 'dc.accounts.owner_account.transfer_out_btn.0.click',
    tip: 'Transfer Out',
    type: 'out',
    w: 20,
  },
  send: { ga: 'dc.accounts.owner_account.send_btn.0.click', tip: 'Send', type: 'send', w: 20 },
  deposit: {
    ga: 'dc.accounts.payment_account.deposit_btn.0.click',
    tip: 'Deposit',
    type: 'deposit',
    w: 20,
  },
  withdraw: {
    ga: 'dc.accounts.payment_account.withdraw_btn.0.click',
    tip: 'Withdraw',
    type: 'withdraw',
    w: 20,
  },
};

interface ActionMenuProps {
  onChange?: (menu: string) => void;
  menus: Array<MenuOption>;
  operations?: string[];
  shareMode?: boolean;
}

export const ActionMenu = memo<ActionMenuProps>(function ActionMenu({
  onChange = () => {},
  operations = [],
  menus = [],
  shareMode = false,
}) {
  if (!menus.length) return null;

  return (
    <Flex justifyContent="flex-end">
      {shareMode ? (
        <DownloadIcon onClick={() => onChange('download')}>
          <IconFont w={20} type={'download'} mx={2} />
        </DownloadIcon>
      ) : (
        <>
          {operations.map((m) => (
            <ActionButton
              key={m}
              gaClickName={OPERATIONS[m].ga}
              mr={8}
              onClick={() => onChange(m)}
              tip={OPERATIONS[m].tip}
            >
              <IconFont type={OPERATIONS[m].type} w={OPERATIONS[m].w} color={'brand.brand6'} />
            </ActionButton>
          ))}
          <DCMenu
            strategy="fixed"
            zIndex={1000}
            stopPropagation={true}
            placement="bottom-end"
            trigger="hover"
            options={menus}
            onMenuSelect={(m) => onChange(m.value)}
          >
            {({ isOpen }) => (
              <StyledMenuButton $open={isOpen}>
                <IconFont w={20} type={'dots-v'} mx={2} />
              </StyledMenuButton>
            )}
          </DCMenu>
        </>
      )}
    </Flex>
  );
});

const styles = css`
  border-radius: 100%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  transition: all 0.1s;

  :hover {
    background-color: rgba(0, 186, 52, 0.2);
    color: #00ba34;
  }
`;

const DownloadIcon = styled(Center)`
  ${styles};
  cursor: pointer;
`;

export const StyledMenuButton = styled(MenuButton, transientOptions)<{ $open?: boolean }>`
  ${styles};
  background-color: ${(props) => (props.$open ? 'rgba(0, 186, 52, 0.1)' : 'transparent')};
  color: ${(props) => (props.$open ? '#00BA34' : '#1E2026')};
`;
