import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { DCCheckbox } from '@/components/common/DCCheckbox';
import { DCMenu } from '@/components/common/DCMenu';
import { MenuOption } from '@/components/common/DCMenuList';
import { InputItem } from '@/components/formitems/InputItem';
import { formatTxType } from '@/utils/billing';
import { trimLongStr } from '@/utils/string';
import { SearchIcon } from '@node-real/icons';
import { InputLeftElement, MenuButton, Text, Tooltip } from '@node-real/uikit';
import cn from 'classnames';
import { xor } from 'lodash-es';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Badge, MenuFooter, MenuHeader } from './Common';

const MAX_SELECTED_NUM = 10;
const TYPES = [
  'greenfield.storage.MsgCreateObject',
  'greenfield.storage.MsgDeleteObject',
  'greenfield.storage.MsgCancelCreateObject',
  'greenfield.storage.MsgSealObject',
  'greenfield.storage.MsgCreateBucket',
  'greenfield.storage.MsgDeleteBucket',
  'greenfield.storage.MsgUpdateBucketInfo',
  'greenfield.payment.MsgDeposit',
  'greenfield.payment.MsgWithdraw',
];

type FilterTypesProps = {
  filterTypes: string[];
  onSetFilterTypes: (types: string[]) => void;
};

export const FilterTypes = ({ filterTypes, onSetFilterTypes }: FilterTypesProps) => {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedType, setSelectedType] = useState<Array<string>>([]);
  const types = TYPES.filter((type) =>
    !typeFilter.trim() ? true : type.toLowerCase().includes(typeFilter.trim().toLowerCase()),
  );

  const typeToOptions = (type: string) => ({
    label: formatTxType(type),
    value: type,
  });
  const typeOptions: MenuOption[] = types.map(typeToOptions);
  const selectedTypeOptions = filterTypes.map(typeToOptions);

  const accountClose = () => {
    onSetFilterTypes(selectedType);
  };

  const accountOpen = () => {
    setSelectedType(filterTypes);
  };

  useEffect(() => {
    setSelectedType(filterTypes);
  }, [router.asPath]);

  return (
    <DCMenu
      emptyText={'No results.'}
      multiple
      options={typeOptions}
      placement="bottom-start"
      menuListProps={{
        w: 202,
        minH: 226,
      }}
      scrollH={150}
      onClose={accountClose}
      onOpen={accountOpen}
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
          {/* <Text onClick={() => setSelectedType(types)}>Select All</Text> */}
          <Text onClick={() => setSelectedType([])}>Clear All</Text>
        </MenuFooter>
      )}
      renderOption={({ label, value }) => (
        <DCCheckbox
          disabled={!selectedType.includes(value) && selectedType.length >= MAX_SELECTED_NUM}
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
          visibility={selectedTypeOptions.length ? 'visible' : 'hidden'}
          content={`${selectedTypeOptions.map((i) => i.label).join(', ')} ${
            selectedTypeOptions.length > 1 ? 'are' : 'is'
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
                    onSetFilterTypes([]);
                  }}
                  className={'icon-selected'}
                  w={24}
                  type={'error'}
                />
              </>
            }
          >
            {!selectedTypeOptions.length ? (
              'Type'
            ) : (
              <>
                {trimLongStr(selectedTypeOptions[0].label, 6, 6, 0)}{' '}
                <Badge>{filterTypes.length}</Badge>
              </>
            )}
          </MenuButton>
        </Tooltip>
      )}
    </DCMenu>
  );
};
