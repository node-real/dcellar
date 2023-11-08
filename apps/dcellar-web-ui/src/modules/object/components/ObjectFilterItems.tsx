import * as React from 'react';
import { KeyboardEvent, memo, MouseEvent, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  Box,
  Collapse,
  Divider,
  Flex,
  InputLeftElement,
  MenuButton,
  Text,
  Tooltip,
} from '@totejs/uikit';
import styled from '@emotion/styled';
import {
  ObjectFilterSize,
  resetObjectListFilter,
  selectObjectList,
  setFilterRange,
  setFilterSizeFrom,
  setFilterSizeTo,
  setFilterTypes,
} from '@/store/slices/object';
import { DCMenu } from '@/components/common/DCMenu';
import { uniq, xor } from 'lodash-es';
import { MenuOption } from '@/components/common/DCMenuList';
import { DCButton } from '@/components/common/DCButton';
import { IconFont } from '@/components/IconFont';
import cn from 'classnames';
import { InputItem } from '@/components/formitems/InputItem';
import { SearchIcon } from '@totejs/icons';
import { DCCheckbox } from '@/components/common/DCCheckbox';
import { trimLongStr } from '@/utils/string';
import dayjs, { Dayjs } from 'dayjs';
import { DCRangePicker } from '@/components/common/DCDatePicker';
import { TimeRangePickerProps } from 'antd';
import { useClickAway } from 'ahooks';
import { DCInputNumber } from '@/components/common/DCInputNumber';
import { useRouter } from 'next/router';

export const INTERNAL_FOLDER_EXTENSION = '0xDB8040c64d24840BD1D6BcAC7112D2A143CC2EEa';

const sizeOptions = [
  { label: 'KB', value: '1' },
  { label: 'MB', value: '1024' },
];
const MAX_SIZE = 1024 * 1024;

interface ObjectFilterItemsProps {}

export const ObjectFilterItems = memo<ObjectFilterItemsProps>(function ObjectFilterItems() {
  const dispatch = useAppDispatch();
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedType, setSelectedType] = useState<Array<string>>([]);
  const [dateOpen, setDateOpen] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>();
  const [activePicker, setActivePicker] = useState<0 | 1>(0);
  const [sizeFrom, setSizeFrom] = useState<ObjectFilterSize>({ value: null, unit: '1' });
  const [sizeTo, setSizeTo] = useState<ObjectFilterSize>({ value: null, unit: '1024' });
  const [sizeOpen, setSizeOpen] = useState(false);
  const filterExpand = useAppSelector((root) => root.object.filterExpand);
  const filterTypes = useAppSelector((root) => root.object.filterTypes);
  const filterRange = useAppSelector((root) => root.object.filterRange);
  const filterSizeFrom = useAppSelector((root) => root.object.filterSizeFrom);
  const filterSizeTo = useAppSelector((root) => root.object.filterSizeTo);
  const objectList = useAppSelector(selectObjectList);
  const router = useRouter();
  const allTypes = uniq(
    objectList.map((i) => {
      if (i.objectName.endsWith('/')) return INTERNAL_FOLDER_EXTENSION;
      const match = i.name.match(/\.([^.]+)$/i);
      if (!match) return 'OTHERS';
      return match[1].toUpperCase();
    }),
  );

  const types = allTypes.filter((type) =>
    !typeFilter.trim()
      ? true
      : type === INTERNAL_FOLDER_EXTENSION
      ? 'folder'.includes(typeFilter.trim().toLowerCase())
      : type.toLowerCase().includes(typeFilter.trim().toLowerCase()),
  );

  const typeToOption = (type: string) => ({
    label: type === INTERNAL_FOLDER_EXTENSION ? 'FOLDER' : type,
    value: type,
  });

  const options: MenuOption[] = types.map(typeToOption);
  const selectedOptions = filterTypes.map(typeToOption);

  const typeClose = () => {
    dispatch(setFilterTypes(selectedType));
  };

  const typeOpen = () => {
    setSelectedType(filterTypes);
  };

  const rangePresets: TimeRangePickerProps['presets'] = [
    { label: 'Current Month', value: [dayjs().startOf('month'), dayjs()] },
    { label: 'Last 3 Months', value: [dayjs().add(-3, 'month'), dayjs()] },
    { label: 'Last 6 Months', value: [dayjs().add(-6, 'month'), dayjs()] },
  ];

  useEffect(() => {
    setSelectedType([]);
    dispatch(resetObjectListFilter());
  }, [router.asPath]);

  useClickAway(
    () => setDateOpen(false),
    [
      () => document.querySelector('.object-list-date-filter'),
      () => document.querySelector('.date-button'),
    ],
  );

  useEffect(() => {
    if (dateOpen) return;
    const from = dateRange?.[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : '';
    const to = dateRange?.[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : '';
    if (!from && to) {
      dispatch(setFilterRange([to, from]));
      return;
    }
    dispatch(setFilterRange([from, to]));
  }, [dateOpen]);

  const onInputNumberKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!e.key.match(/[0-9]|backspace|enter|delete|arrow(left|right|up|down)/i)) e.preventDefault();
  };

  const onSetSize = () => {
    setSizeOpen(false);
    if (sizeFrom.value !== null && sizeTo.value !== null) {
      const from = sizeFrom.value * Number(sizeFrom.unit);
      const to = sizeTo.value * Number(sizeTo.unit);
      if (to < from) {
        dispatch(setFilterSizeFrom(sizeTo));
        dispatch(setFilterSizeTo(sizeFrom));
        return;
      }
    }
    dispatch(setFilterSizeFrom(sizeFrom));
    dispatch(setFilterSizeTo(sizeTo));
  };

  const onResetSize = (e: MouseEvent) => {
    e.stopPropagation();
    const from: ObjectFilterSize = { value: null, unit: '1' };
    const to: ObjectFilterSize = { value: null, unit: '1024' };
    dispatch(setFilterSizeFrom(from));
    dispatch(setFilterSizeTo(to));
    setSizeFrom(from);
    setSizeTo(to);
  };

  const onSizeOpen = () => {
    setSizeFrom(filterSizeFrom);
    setSizeTo(filterSizeTo);
  };

  return (
    <Collapse in={filterExpand}>
      <Divider />
      <Container>
        <DCMenu
          emptyText={'No results.'}
          multiple
          options={options}
          placement="bottom-start"
          menuListProps={{
            w: 202,
            minH: 226,
          }}
          scrollH={150}
          onClose={typeClose}
          onOpen={typeOpen}
          renderHeader={() => (
            <MenuHeader>
              <InputItem
                value={typeFilter}
                autoFocus={false}
                leftElement={
                  <InputLeftElement pointerEvents={'none'} w={28}>
                    <SearchIcon w={16} color={'readable.secondary'} />
                  </InputLeftElement>
                }
                placeholder="Search"
                onChange={(e) => setTypeFilter(e.target.value)}
              />
            </MenuHeader>
          )}
          renderFooter={() => (
            <MenuFooter>
              <Text onClick={() => setSelectedType(types)}>Select All</Text>
              <Text onClick={() => setSelectedType([])}>Clear All</Text>
            </MenuFooter>
          )}
          renderOption={({ label, value }) => (
            <DCCheckbox
              checked={selectedType.includes(value)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedType(xor(selectedType, [value]));
              }}
            >
              <Text as={'span'} fontSize={14} fontWeight={400}>
                {label}
              </Text>
            </DCCheckbox>
          )}
        >
          {({ isOpen }) => (
            <Tooltip
              placement="top-start"
              visibility={selectedOptions.length ? 'visible' : 'hidden'}
              content={`${selectedOptions.map((i) => i.label).join(', ')} ${
                selectedOptions.length > 1 ? 'are' : 'is'
              } selected.`}
            >
              <MenuButton
                className={cn(
                  { 'menu-open': isOpen, 'button-filtered': !!filterTypes.length && !isOpen },
                  'type-button',
                )}
                as={DCButton}
                variant="ghost"
                leftIcon={<IconFont w={24} type="checklist" />}
                rightIcon={
                  <>
                    <IconFont
                      className={'icon-none'}
                      w={24}
                      type={isOpen ? 'menu-open' : 'menu-close'}
                    />
                    <IconFont
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedType([]);
                        dispatch(setFilterTypes([]));
                      }}
                      className={'icon-selected'}
                      w={24}
                      type={'error'}
                    />
                  </>
                }
              >
                {!selectedOptions.length ? (
                  'Type'
                ) : (
                  <>
                    {trimLongStr(selectedOptions[0].label, 6, 6, 0)}{' '}
                    <Badge>{filterTypes.length}</Badge>
                  </>
                )}
              </MenuButton>
            </Tooltip>
          )}
        </DCMenu>

        <Box position="relative">
          <DCButton
            onClick={() => {
              setActivePicker(0);
              setDateOpen(!dateOpen);
            }}
            className={cn(
              { 'menu-open': dateOpen, 'button-filtered': !!dateRange?.length && !dateOpen },
              'date-button',
            )}
            variant="ghost"
            leftIcon={<IconFont w={24} type="calendar" />}
            rightIcon={
              <>
                <IconFont
                  className={'icon-none'}
                  w={24}
                  type={dateOpen ? 'menu-open' : 'menu-close'}
                />
                <IconFont
                  onClick={(e) => {
                    e.stopPropagation();
                    setDateRange(undefined);
                    dispatch(setFilterRange(['', '']));
                  }}
                  className={'icon-selected'}
                  w={24}
                  type={'error'}
                />
              </>
            }
          >
            {filterRange.filter(Boolean).length
              ? filterRange.join(' ~ ') + (filterRange[1] ? '' : 'Now')
              : 'Date Created'}
          </DCButton>
          <DCRangePicker
            dropdownClassName={'object-list-date-filter'}
            activePickerIndex={activePicker}
            value={dateRange}
            allowEmpty={[true, true]}
            presets={rangePresets}
            dropdownAlign={{ offset: [0, -6] }}
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
            disabledDate={(e) => e && e > dayjs().endOf('day')}
          />
        </Box>
        <DCMenu
          isOpen={sizeOpen}
          onOpen={onSizeOpen}
          onClose={() => setSizeOpen(false)}
          menuListProps={{
            w: 202,
          }}
          options={[{ label: '', value: '' }]}
          placement="bottom-start"
          renderHeader={() => (
            <SizeContainer>
              <Flex h={32} gap={8} w="100%">
                <DCInputNumber
                  style={{ flex: 1 }}
                  value={sizeFrom.value}
                  controls={false}
                  min={0}
                  max={MAX_SIZE}
                  precision={0}
                  onKeyDown={onInputNumberKeyDown}
                  onChange={(e) => setSizeFrom((v) => ({ ...v, value: e }))}
                  placeholder="Set amount"
                />
                <DCMenu
                  options={sizeOptions}
                  matchWidth
                  strategy="fixed"
                  value={sizeFrom.unit}
                  onMenuSelect={({ value }) =>
                    setSizeFrom((v) => ({ ...v, unit: value as ObjectFilterSize['unit'] }))
                  }
                >
                  {({ isOpen }) => (
                    <MenuButton
                      className="unit-button"
                      h={32}
                      as={DCButton}
                      variant={'ghost'}
                      bg={'bg.bottom'}
                      rightIcon={<IconFont w={16} type={isOpen ? 'menu-open' : 'menu-close'} />}
                    >
                      {sizeFrom.unit === '1' ? 'KB' : 'MB'}
                    </MenuButton>
                  )}
                </DCMenu>
              </Flex>
              <Text fontSize={16} fontWeight={500}>
                to
              </Text>
              <Flex h={32} gap={8} w="100%">
                <DCInputNumber
                  style={{ flex: 1 }}
                  value={sizeTo.value}
                  controls={false}
                  min={0}
                  max={MAX_SIZE}
                  precision={0}
                  onChange={(e) => setSizeTo((v) => ({ ...v, value: e }))}
                  onKeyDown={onInputNumberKeyDown}
                  placeholder="Set amount"
                />

                <DCMenu
                  options={sizeOptions}
                  matchWidth
                  strategy="fixed"
                  value={sizeTo.unit}
                  onMenuSelect={({ value }) =>
                    setSizeTo((v) => ({ ...v, unit: value as ObjectFilterSize['unit'] }))
                  }
                >
                  {({ isOpen }) => (
                    <MenuButton
                      className="unit-button"
                      h={32}
                      as={DCButton}
                      variant={'ghost'}
                      bg={'bg.bottom'}
                      rightIcon={<IconFont w={16} type={isOpen ? 'menu-open' : 'menu-close'} />}
                    >
                      {sizeTo.unit === '1' ? 'KB' : 'MB'}
                    </MenuButton>
                  )}
                </DCMenu>
              </Flex>
              <DCButton h={32} w={94} onClick={onSetSize}>
                Confirm
              </DCButton>
            </SizeContainer>
          )}
          renderOption={() => <div />}
        >
          {({ isOpen }) => (
            <MenuButton
              onClick={() => setSizeOpen(true)}
              as={DCButton}
              className={cn(
                {
                  'menu-open': isOpen,
                  'button-filtered':
                    (filterSizeFrom.value !== null || filterSizeTo.value !== null) && !isOpen,
                },
                'size-button',
              )}
              variant="ghost"
              leftIcon={<IconFont w={24} type="folder" />}
              rightIcon={
                <>
                  <IconFont
                    className={'icon-none'}
                    w={24}
                    type={isOpen ? 'menu-open' : 'menu-close'}
                  />
                  <IconFont
                    onClick={onResetSize}
                    className={'icon-selected'}
                    w={24}
                    type={'error'}
                  />
                </>
              }
            >
              {filterSizeFrom?.value !== null && filterSizeTo?.value !== null
                ? `${filterSizeFrom.value}${filterSizeFrom.unit === '1' ? 'KB' : 'MB'} ~ ${
                    filterSizeTo.value
                  }${filterSizeTo.unit === '1' ? 'KB' : 'MB'}`
                : filterSizeFrom?.value !== null && filterSizeTo?.value === null
                ? `>= ${filterSizeFrom.value}${filterSizeFrom.unit === '1' ? 'KB' : 'MB'}`
                : filterSizeTo?.value !== null && filterSizeFrom?.value === null
                ? `<= ${filterSizeTo.value}${filterSizeTo.unit === '1' ? 'KB' : 'MB'}`
                : 'Size'}
            </MenuButton>
          )}
        </DCMenu>
      </Container>
    </Collapse>
  );
});

const SizeContainer = styled(Flex)`
  flex-direction: column;
  gap: 16px;
  align-items: center;
  padding: 16px 16px 0 16px;

  + .menu-items {
    pointer-events: none;
  }
`;

const Badge = styled.span`
  height: 24px;
  min-width: 24px;
  padding: 0 3px;
  background: var(--ui-colors-bg-bottom);
  border-radius: 100%;
  color: var(--ui-colors-readable-normal);
  line-height: 24px;
`;

const Container = styled(Flex)`
  align-items: center;
  gap: 12px;
  margin: 16px 0;

  .menu-list-empty {
    padding-top: 0;
    height: auto;
  }

  .menu-list-empty-icon {
    display: none;
    + p {
      color: var(--ui-colors-readable-tertiary);
      font-size: 12px;
      font-weight: 500;
      margin-top: 50px;
    }
  }

  . .ant-input-number {
    border-radius: 4px;
    box-shadow: none !important;
    background: var(--ui-colors-bg-bottom);
  }

  .size-button {
    min-width: 121px;
  }

  .ui-button {
    padding-left: 16px;
  }

  .unit-button {
    padding-left: 8px;
    font-size: 14px;
    width: 60px;
  }

  .icon-none {
    display: inline-flex;
  }

  .icon-selected {
    display: none;
  }

  .button-filtered:hover {
    .icon-none {
      display: none;
    }

    .icon-selected {
      color: var(--ui-colors-readable-normal);
      &:hover {
        color: var(--ui-colors-brand-brand6);
      }
      display: inline;
    }
  }

  .menu-open {
    border-color: var(--ui-colors-brand-brand6);
    color: var(--ui-colors-brand-brand6);
  }

  .type-button {
    min-width: 126px;
  }

  .date-button {
    min-width: 190px;
  }

  label {
    display: flex;
    align-items: center;
    height: 33px;
    padding: 0 8px;

    span:last-of-type {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
`;

const MenuHeader = styled(Flex)`
  padding: 8px;

  .ui-input {
    height: 29px;
    padding-left: 28px;
    padding-right: 4px;
    font-weight: 400;
    font-size: 14px;
  }

  + div {
    flex: 1;
  }

  + div .ui-menu-item {
    padding: 0;
  }
`;

const MenuFooter = styled(Flex)`
  font-weight: 500;
  justify-content: space-between;
  height: 31px;
  align-items: center;
  padding: 8px 10px;
  border-top: 1px solid var(--ui-colors-readable-border);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  user-select: none;

  > p {
    cursor: pointer;
  }

  > p:hover {
    color: var(--ui-colors-brand-brand6);
  }
`;
