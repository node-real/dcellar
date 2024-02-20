import { DCMenu } from '@/components/common/DCMenu';
import { useEffect, useState } from 'react';
import { xor } from 'lodash-es';
import { MenuOption } from '@/components/common/DCMenuList';
import { InputItem } from '@/components/formitems/InputItem';
import { InputLeftElement, MenuButton, Text, Tooltip } from '@node-real/uikit';
import { SearchIcon } from '@node-real/icons';
import { DCCheckbox } from '@/components/common/DCCheckbox';
import { DCButton } from '@/components/common/DCButton';
import { IconFont } from '@/components/IconFont';
import { trimLongStr } from '@/utils/string';
import cn from 'classnames';
import { useRouter } from 'next/router';
import { Badge, MenuFooter, MenuHeader } from '@/modules/accounts/components/Common';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectBucketDailyStorage, selectFilterBuckets, setFilterBuckets } from '@/store/slices/dashboard';

export const FilterBuckets = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const bucketDailyStorage = useAppSelector(selectBucketDailyStorage());
  const { loginAccount } = useAppSelector((root) => root.persist);
  const filterBuckets = useAppSelector(selectFilterBuckets());
  const [nameFilter, setNameFilter] = useState('');
  const [selectedBucket, setSelectedBucket] = useState<Array<string>>([]);
  const nameToOptions = (name: string) => ({
    label: name,
    value: name,
  });
  const bucketNames = bucketDailyStorage.map((item) => item.BucketName);
  // bucket name will 63 characters
  const names = bucketNames.filter((name) =>
    !nameFilter.trim() ? true : name.toLowerCase().includes(nameFilter.trim().toLowerCase()),
  );

  const typeOptions: MenuOption[] = names.map(nameToOptions);
  const selectedTypeOptions = filterBuckets.map(nameToOptions);
  const accountClose = () => {
    dispatch(setFilterBuckets({ loginAccount, buckets: selectedBucket }));
  };
  const accountOpen = () => {
    setSelectedBucket(filterBuckets);
  };

  useEffect(() => {
    return setSelectedBucket(filterBuckets);
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
            value={nameFilter}
            autoFocus={false}
            leftElement={
              <InputLeftElement pointerEvents={'none'} w={28}>
                <SearchIcon w={16} color={'readable.secondary'} />
              </InputLeftElement>
            }
            placeholder="Search"
            onChange={(e) => setNameFilter(e.target.value)}
          />
        </MenuHeader>
      )}
      renderFooter={() => (
        <MenuFooter justifyContent={'space-between'}>
          <Text onClick={() => setSelectedBucket(names)}>Select All</Text>
          <Text onClick={() => setSelectedBucket([])}>Clear All</Text>
        </MenuFooter>
      )}
      renderOption={({ label, value }) => (
        <DCCheckbox
          checked={selectedBucket.includes(value)}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedBucket(xor(selectedBucket, [value]));
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
              { 'menu-open': isOpen, 'button-filtered': !!filterBuckets.length && !isOpen },
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
                    setSelectedBucket([]);
                    dispatch(setFilterBuckets({ loginAccount, buckets: [] }));
                  }}
                  className={'icon-selected'}
                  w={24}
                  type={'error'}
                />
              </>
            }
          >
            {!selectedTypeOptions.length ? (
              'Bucket'
            ) : (
              <>
                {trimLongStr(selectedTypeOptions[0].label, 6, 6, 0)}{' '}
                <Badge>{filterBuckets.length}</Badge>
              </>
            )}
          </MenuButton>
        </Tooltip>
      )}
    </DCMenu>
  );
};
