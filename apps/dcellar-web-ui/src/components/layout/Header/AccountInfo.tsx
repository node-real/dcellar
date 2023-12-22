import React, { memo, useRef, useState } from 'react';
import { Box, Button, Circle, Fade, Flex, Portal, Text, useDisclosure, useOutsideClick } from '@totejs/uikit';
import { CopyText } from '@/components/common/CopyText';
import { Tips } from '@/components/common/Tips';
import { NewBalance } from '@/components/layout/Header/NewBalance';
import { useAppDispatch, useAppSelector } from '@/store';
import { getShortenWalletAddress } from '@/utils/wallet';
import { useRouter } from 'next/router';
import { selectHasUploadingTask, setDisconnectWallet, setupBnbPrice } from '@/store/slices/global';
import { useLogin } from '@/hooks/useLogin';
import { useDebounceEffect } from 'ahooks';
import { setupAccountInfo } from '@/store/slices/accounts';
import { Avatar } from '@/components/Avatar';
import styled from '@emotion/styled';
import { DCLink } from '@/components/common/DCLink';
import { IconFont } from '@/components/IconFont';
import { InternalRoutePaths } from '@/constants/paths';

interface AccountInfoProps {}

export const AccountInfo = memo<AccountInfoProps>(function AccountCard() {
  const { loginAccount } = useAppSelector((root) => root.persist);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { logout } = useLogin();
  const shortAddress = getShortenWalletAddress(loginAccount);
  const ref = useRef(null);
  const isUploading = useAppSelector(selectHasUploadingTask);
  const [isOpen, setOpen] = useState(false);

  const onDisconnectClick = () => {
    if (!isUploading) {
      return logout(true);
    }
    dispatch(setDisconnectWallet(true));
  };

  const onNavigate = (target: string) => () => {
    router.push(target);
    setOpen(false);
  };

  useOutsideClick({
    ref,
    handler: () => setOpen(false),
  });

  useDebounceEffect(() => {
    if (!isOpen) return;
    dispatch(setupBnbPrice());
    dispatch(setupAccountInfo(loginAccount));
  }, [isOpen]);

  return (
    <>
      <LoginAccount
        data-track-id="dc.main.header.account.click"
        bg={isOpen ? 'bg.bottom' : 'inherit'}
        onClick={() => setOpen(true)}
      >
        <Avatar id={shortAddress} w={36} />
        <span>{shortAddress}</span>
      </LoginAccount>
      <Portal>
        <Fade in={isOpen} unmountOnExit position="absolute" zIndex="1400">
          <PopContainer ref={ref}>
            <Account>
              <Avatar id={shortAddress} w={20} />
              <CopyText value={loginAccount} gaClickName="dc.main.account.copy_add.click">
                <Text fontWeight="500" fontSize="14px" marginX="2px">
                  {shortAddress}
                </Text>
              </CopyText>
            </Account>
            <Flex alignItems="center" margin={'16px auto 0'}>
              <Text color="readable.tertiary" fontWeight="500" fontSize="12px" lineHeight="20px">
                Greenfield Available Balance
              </Text>
              <Tips
                containerWidth={'200px'}
                tips={
                  <Box fontSize={'12px'} lineHeight="14px" w={'200px'}>
                    <Box>
                      Please notice that due to the locked fee, Greenfield available balance is not
                      equal to your account overall balance, which is shown at your wallet.
                    </Box>
                    <DCLink
                      href="https://docs.nodereal.io/docs/dcellar-faq#question-what-is-greenfield-available-balance"
                      target="_blank"
                    >
                      Learn more
                    </DCLink>
                  </Box>
                }
              />
            </Flex>
            <NewBalance />
            <Flex
              alignItems="center"
              mt="16px"
              width="100%"
              mb="12px"
              justifyContent="space-between"
              h="24px"
            >
              <ActionButton
                data-track-id="dc.main.account.transferin.click"
                variant="ghost"
                onClick={onNavigate(InternalRoutePaths.transfer_in)}
              >
                <StyledIcon>
                  <IconFont type="in" />
                </StyledIcon>
                <Box fontWeight={500} fontSize="14px" marginTop={8}>
                  Transfer In
                </Box>
              </ActionButton>
              <ActionButton
                data-track-id="dc.main.account.transferout.click"
                variant="ghost"
                onClick={onNavigate(InternalRoutePaths.transfer_out)}
              >
                <StyledIcon>
                  <IconFont type="out" />
                </StyledIcon>
                <Box fontWeight={500} fontSize="14px" marginTop={8}>
                  Transfer Out
                </Box>
              </ActionButton>
              <ActionButton
                data-track-id="dc.main.account.send.click"
                variant="ghost"
                onClick={onNavigate(InternalRoutePaths.send)}
              >
                <StyledIcon>
                  <IconFont type="send" />
                </StyledIcon>
                <Box fontWeight={500} fontSize="14px" marginTop={8}>
                  Send
                </Box>
              </ActionButton>
            </Flex>
            <Flex h="1px" marginTop="20px" marginBottom="8px" w="100%" bg="readable.border" />
            <MenuItem
              data-track-id="dc.main.account.disconnect.click"
              onClick={onNavigate('/accounts')}
            >
              <IconFont type="account" w={24} />
              <Text>Accounts</Text>
            </MenuItem>
            <MenuItem data-track-id="dc.main.account.disconnect.click" onClick={onDisconnectClick}>
              <IconFont type="logout" w={24} />
              <Text>Disconnect</Text>
            </MenuItem>
          </PopContainer>
        </Fade>
      </Portal>
    </>
  );
});

const MenuItem = styled(Flex)`
  font-weight: 500;
  font-size: 16px;
  height: 56px;
  align-items: center;
  padding: 0 16px;
  cursor: pointer;
  border-radius: 8px;
  gap: 8px;

  :hover {
    background-color: var(--ui-colors-bg-bottom);
  }
`;

const StyledIcon = styled(Circle)`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--ui-colors-readable-border);
  background: var(--ui-colors-brand-normal);
  color: #ffffff;
  font-size: 20px;
`;

const ActionButton = styled(Button)`
  height: 81px;
  width: 97px;
  padding: 0;
  border-radius: 4px;
  border: none;
  flex-direction: column;
  place-items: center;

  :hover {
    background: #f5f5f5;
  }
`;

const LoginAccount = styled(Flex)`
  align-items: center;
  justify-content: center;
  height: 44px;
  border-radius: 44px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  gap: 10px;
  padding: 4px 10px 4px 6px;

  :hover {
    background: var(--ui-colors-bg-bottom);
  }
`;

const PopContainer = styled(Flex)`
  width: 340px;
  background: var(--ui-colors-readable-white);
  border-radius: 4px;
  position: fixed;
  right: 24px;
  flex-direction: column;
  top: 70px;
  padding: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
`;

const Account = styled(Flex)`
  align-items: center;
  height: 34px;
  background-color: var(--ui-colors-bg-bottom);
  border-radius: 18px;
  width: fit-content;
  border: 1px solid var(--ui-colors-readable-border);
  padding: 10px;
  margin: 0 auto;
`;
