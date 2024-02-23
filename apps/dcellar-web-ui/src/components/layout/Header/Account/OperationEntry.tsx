import { IconFont } from '@/components/IconFont';
import { DCButton, DCButtonProps } from '@/components/common/DCButton';
import { useLogin } from '@/hooks/useLogin';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectHasUploadingTask, setDisconnectWallet } from '@/store/slices/global';
import { Text } from '@node-real/uikit';
import { useRouter } from 'next/router';

export const OperationEntry = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { logout } = useLogin();
  const isUploading = useAppSelector(selectHasUploadingTask);
  const onNavigate = (target: string) => () => {
    router.push(target);
  };
  const onDisconnectClick = () => {
    if (!isUploading) {
      return logout(true);
    }
    dispatch(setDisconnectWallet(true));
  };

  return (
    <>
      <OperationEntryItem
        onClick={onNavigate('/accounts')}
        gaClickName="dc.main.account.accounts.click"
      >
        <IconFont type="account" w={24} />
        <Text>Accounts</Text>
      </OperationEntryItem>
      <OperationEntryItem
        onClick={onDisconnectClick}
        gaClickName="dc.main.account.disconnect.click"
      >
        <IconFont type="logout" w={24} />
        <Text>Disconnect</Text>
      </OperationEntryItem>
    </>
  );
};

export const OperationEntryItem = ({ children, ...props }: DCButtonProps) => {
  return (
    <DCButton
      width={'100%'}
      border={'none'}
      justifyContent={'flex-start'}
      variant="ghost"
      h={56}
      alignItems={'center'}
      gap={8}
      _hover={{
        bgColor: 'bg.bottom',
      }}
      {...props}
    >
      {children}
    </DCButton>
  );
};
