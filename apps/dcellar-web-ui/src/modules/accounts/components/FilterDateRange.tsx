import { DCButton } from '@/components/common/DCButton';
import { Box } from '@totejs/uikit';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useState } from 'react';
import cn from 'classnames';
import { IconFont } from '@/components/IconFont';
import { rangePresets } from './Common';
import { DCRangePicker } from '@/components/common/DCDatePicker';
import { useClickAway } from 'ahooks';

type FilterDateRangeProps = {
  filterDateRange: [string, string];
  onSetFilterDateRange: (dataRange: [string, string]) => void;
};
export const FilterDateRange = ({
  filterDateRange,
  onSetFilterDateRange,
}: FilterDateRangeProps) => {
  const [activePicker, setActivePicker] = useState<0 | 1>(0);
  const [dateOpen, setDateOpen] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>();
  useEffect(() => {
    if (dateOpen) {
      return setDateRange([
        filterDateRange[0] ? dayjs(filterDateRange[0]) : dayjs(undefined),
        filterDateRange[1] ? dayjs(filterDateRange[1]) : dayjs(undefined),
      ]);
    }
    const from = dateRange?.[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : '';
    const to = dateRange?.[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : '';
    if (!from && to) {
      onSetFilterDateRange([to, from]);
      return;
    }
    onSetFilterDateRange([from, to]);
  }, [dateOpen]);

  useClickAway(
    () => setDateOpen(false),
    [
      () => document.querySelector('.object-list-date-filter'),
      () => document.querySelector('.date-button'),
    ],
  );
  const disabledDate = (current: Dayjs) => {
    const isFeature = current.startOf('d').valueOf() > +new Date();
    const isSixMonthsAgo =
      current.startOf('d').valueOf() <=
      dayjs(+new Date()).subtract(6, 'M').subtract(1, 'd').startOf('d').valueOf();
    return isFeature || isSixMonthsAgo;
  };

  return (
    <Box position="relative">
      <DCButton
        onClick={() => {
          setActivePicker(0);
          setDateOpen(!dateOpen);
        }}
        className={cn(
          {
            'menu-open': dateOpen,
            'button-filtered':
              ((!!filterDateRange?.length && filterDateRange[0]) || !!dateRange?.length) &&
              !dateOpen,
          },
          'date-button',
        )}
        variant="ghost"
        leftIcon={<IconFont w={24} type="calendar" />}
        rightIcon={
          <>
            <IconFont className={'icon-none'} w={24} type={dateOpen ? 'menu-open' : 'menu-close'} />
            <IconFont
              onClick={(e) => {
                e.stopPropagation();
                setDateRange(undefined);
                onSetFilterDateRange(['', '']);
              }}
              className={'icon-selected'}
              w={24}
              type={'error'}
            />
          </>
        }
      >
        {filterDateRange.filter(Boolean).length
          ? filterDateRange.join(' ~ ') + (filterDateRange[1] ? '' : 'Now')
          : 'Date Created'}
      </DCButton>
      <DCRangePicker
        changeOnBlur
        disabledDate={disabledDate}
        dropdownClassName={'object-list-date-filter'}
        activePickerIndex={activePicker}
        value={dateRange}
        allowEmpty={[true, true]}
        presets={rangePresets}
        dropdownAlign={{ offset: [dateRange ? 270 : 170, -6] }}
        open={dateOpen}
        style={{ visibility: 'hidden', width: 0, position: 'absolute', left: 0, bottom: 0 }}
        getPopupContainer={() => document.getElementById('layout-main')!}
        onChange={(e) => {
          setDateRange(e as any);
        }}
        format={'YYYY-MM-DD'}
        onCalendarChange={(_, range, info) => {
          setActivePicker(info.range === 'end' ? 0 : 1);
          if (info.range === 'end') setDateOpen(false);
        }}
      />
    </Box>
  );
};
