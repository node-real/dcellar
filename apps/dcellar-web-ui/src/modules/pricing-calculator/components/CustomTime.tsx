import { DCButton } from '@/components/common/DCButton';
import { smMedia } from '@/modules/responsive';
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  useOutsideClick,
} from '@node-real/uikit';
import { useCallback, useEffect, useRef } from 'react';
import { TTimeOption, TimeUnits, swapObj } from '../utils';
import { NumInput } from './NumInput';
import { SizeMenu } from './SizeMenu';

type Props = {
  selected: boolean;
  customStorageTime: {
    id: string;
    title: string;
    unit: string;
    value: string;
  };
  gaClickName: string;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  onChangeButton: () => void;
  onChangeInput: (option: TTimeOption) => void;
};
export const CustomTime = ({
  isOpen,
  selected,
  customStorageTime,
  onClose,
  onToggle,
  onChangeButton,
  onChangeInput,
  gaClickName,
}: Props) => {
  const ref = useRef(null);
  const swapTimeUnits = swapObj(TimeUnits);
  const handleNavigation = useCallback(
    (e: any) => {
      isOpen && onClose();
    },
    [isOpen, onClose],
  );
  useEffect(() => {
    window.addEventListener('scroll', handleNavigation);

    return () => {
      window.removeEventListener('scroll', handleNavigation);
    };
  }, [handleNavigation]);
  useOutsideClick({
    ref,
    handler: () => isOpen && onClose(),
  });

  return (
    <Popover isOpen={isOpen} placement="bottom">
      <PopoverTrigger>
        <DCButton
          variant="ghost"
          borderColor={selected ? 'brand.brand6' : 'readable.border'}
          onClick={() => {
            onChangeButton();
            onToggle();
          }}
          gaClickName={gaClickName}
          sx={{
            [smMedia]: {
              width: '100%',
              fontSize: '14px',
              padding: '8px',
              whiteSpace: 'nowrap',
            },
          }}
        >
          {customStorageTime.title}: {customStorageTime.value} {TimeUnits[customStorageTime.unit]}
          {+customStorageTime.value > 1 ? 's' : ''}
        </DCButton>
      </PopoverTrigger>
      <PopoverContent
        ref={ref}
        w={226}
        p={16}
        borderRadius={4}
        bgColor={'#fff'}
        border="1px solid readable.border"
        boxShadow={'0px 4px 20px 0px rgba(0, 0, 0, 0.04)'}
      >
        {/* <PopoverCloseButton onClick={onClose} color={'readable.tertiary'} /> */}
        <PopoverHeader fontSize={14} fontWeight={600} color={'readable.normal'}>
          Custom Storage Time
        </PopoverHeader>
        <PopoverBody display={'flex'}>
          <NumInput
            w={120}
            h={32}
            type="inter"
            borderRadius={4}
            value={customStorageTime.value}
            onChangeValue={(item) => {
              onChangeInput({ ...customStorageTime, value: item });
            }}
          />
          <SizeMenu
            buttonStyles={{ height: '32px', marginLeft: '8px', borderRadius: '4px' }}
            sizes={['Day', 'Month', 'Year']}
            value={TimeUnits[customStorageTime.unit]}
            onItemClick={(item: string) => {
              const unit = swapTimeUnits[item];
              onChangeInput({ ...customStorageTime, unit });
            }}
            iconStyles={{
              w: 16,
            }}
          />
        </PopoverBody>
        <PopoverFooter justifyContent={'flex-start'}>
          <DCButton onClick={() => onClose()}>Confirm</DCButton>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
};
