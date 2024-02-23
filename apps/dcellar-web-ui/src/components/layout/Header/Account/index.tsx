import { useAppSelector } from '@/store';
import {
  Box,
  Popover,
  PopoverContent,
  PopoverContentProps,
  PopoverTrigger,
} from '@node-real/uikit';
import { TransferEntry } from './TransferEntry';
import { Address } from './Address';
import { Balance } from './Balance';
import { OperationEntry } from './OperationEntry';

export const Account = () => {
  const { loginAccount } = useAppSelector((root) => root.persist);

  return (
    <Popover>
      <PopoverTrigger>
        <Box>
          <Address address={loginAccount} />
        </Box>
      </PopoverTrigger>
      <PopContent>
        <Balance address={loginAccount} />
        <TransferEntry />
        <OperationEntry />
      </PopContent>
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
