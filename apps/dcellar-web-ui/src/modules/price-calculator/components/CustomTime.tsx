import {
  Popover,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
} from '@totejs/uikit';
import React, { useEffect, useMemo } from 'react';
import { NumInput } from './NumInput';
import { SizeMenu } from './SizeMenu';
import { DCButton } from '@/components/common/DCButton';
import { TTimeOption, TimeUnits, swapObj } from '../utils';
import { useScroll } from 'ahooks';
import { smMedia } from '@/modules/responsive';

type Props = {
  selected: boolean;
  customStorageTime: {
    id: string;
    title: string;
    unit: string;
    value: string;
  }
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  onChangeButton: () => void;
  onChangeInput: (option: TTimeOption) => void;
};
export const CustomTime = ({ isOpen, selected, customStorageTime, onClose, onToggle, onChangeButton, onChangeInput }: Props) => {
  const swapTimeUnits = swapObj(TimeUnits);
  const scroll = useScroll(document);
  useEffect(() => {
    if (isOpen && scroll) onClose();
  }, [scroll])
  return (
    <Popover isOpen={isOpen} placement="bottom">
      <PopoverTrigger>
        <DCButton
          variant="ghost"
          borderColor={selected ? 'readable.brand6' : 'readable.border'}
          onClick={() => {
            onChangeButton();
            onToggle();
          }}
          sx={{
            [smMedia]: {
              width: '100%',
              fontSize: '14px',
              padding: '8px',
              whiteSpace: 'nowrap',
            }
          }}
        >
          {customStorageTime.title}: {customStorageTime.value} {TimeUnits[customStorageTime.unit]}{+customStorageTime.value > 1 ? 's' : ''}
        </DCButton>
      </PopoverTrigger>
      <PopoverContent
        w={226}
        p={16}
        borderRadius={4}
        bgColor={'#fff'}
        boxShadow={'0px 4px 20px 0px rgba(0, 0, 0, 0.04)'}
      >
        <PopoverCloseButton onClick={onClose} color={'readable.tertiary'} />
        <PopoverHeader fontSize={14} fontWeight={600} color={'readable.normal'}>
          Custom Storage Time
        </PopoverHeader>
        <PopoverBody display={'flex'}>
          <NumInput w={120} h={32} borderRadius={4} value={customStorageTime.value} onChangeValue={(item) => {
            onChangeInput({ ...customStorageTime, value: item })
          }
          } />
          <SizeMenu
            buttonStyles={{ height: '32px', marginLeft: '8px', borderRadius:'4px' }}
            sizes={['Day', 'Month', 'Year']}
            value={TimeUnits[customStorageTime.unit]}
            onItemClick={(item: string) => {
              const unit = swapTimeUnits[item];
              onChangeInput({...customStorageTime, unit})
            }}
          />
        </PopoverBody>
        <PopoverFooter justifyContent={'flex-start'}>
          <DCButton h={40} w={94} variant="dcPrimary" onClick={() => onClose()}>
            Confirm
          </DCButton>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
};
