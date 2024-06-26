import { useAppSelector } from '@/store';
import {
  Box,
  Popover,
  PopoverContent,
  PopoverContentProps,
  PopoverTrigger,
  Portal,
} from '@node-real/uikit';
import { TransferEntry } from './TransferEntry';
import { Address } from './Address';
import { Balance } from './Balance';
import { OperationEntry } from './OperationEntry';

export const Account = () => {
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);

  return (
    <Popover>
      <PopoverTrigger>
        <Box>
          <Address address={loginAccount} />
        </Box>
      </PopoverTrigger>
      <Portal>
        <PopContent>
          <Balance address={loginAccount} />
          <TransferEntry />
          <OperationEntry />
        </PopContent>
      </Portal>
    </Popover>
  );
};

export const PopContent = ({ children, ...props }: PopoverContentProps) => {
  return (
    <PopoverContent
      w={340}
      bgColor={'readable.white'}
      borderRadius={4}
      p={16}
      color={'readable.normal'}
      boxShadow={'0 4px 24px rgba(0,0,0,0.08)'}
      {...props}
    >
      {children}
    </PopoverContent>
  );
};
