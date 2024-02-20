import { DCMenu } from '@/components/common/DCMenu';
import React, { useEffect, useState } from 'react';
import { useAccountList } from '../hooks';
import { keyBy, xor } from 'lodash-es';
import { MenuOption } from '@/components/common/DCMenuList';
import { useAppDispatch, useAppSelector } from '@/store';
import { setAllFilterAccounts } from '@/store/slices/billing';
import { Badge, MenuFooter, MenuHeader } from './Common';
import { InputItem } from '@/components/formitems/InputItem';
import { InputLeftElement, MenuButton, Text, Tooltip } from '@node-real/uikit';
import { SearchIcon } from '@node-real/icons';
import { DCCheckbox } from '@/components/common/DCCheckbox';
import { DCButton } from '@/components/common/DCButton';
import { IconFont } from '@/components/IconFont';
import { trimLongStr } from '@/utils/string';
import cn from 'classnames';
import { useRouter } from 'next/router';

export const FilterAccounts = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [accountFilter, setAccountFilter] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Array<string>>([]);
  const allFilterAccounts = useAppSelector((root) => root.billing.allFilterAccounts);
  const accountList = useAccountList();
  const keyAccountList = keyBy(accountList, 'id');
  const idToOptions = (id: string) => ({
    label: keyAccountList[id]?.name,
    value: id,
    address: keyAccountList[id]?.address,
  });
  const accountIds = accountList
    .filter((account) =>
      !accountFilter.trim()
        ? true
        : account.name.toLowerCase().includes(accountFilter.trim().toLowerCase()) ||
          account.address.toLowerCase().includes(accountFilter.trim().toLowerCase()),
    )
    .map((item) => item.id);
  const accountOptions: MenuOption[] = accountIds.map(idToOptions);
  const selectedAccountOptions = allFilterAccounts.map(idToOptions);
  const accountClose = () => {
    dispatch(setAllFilterAccounts(selectedAccount));
  };
  const accountOpen = () => {
    setSelectedAccount(allFilterAccounts);
  };
  useEffect(() => {
    setSelectedAccount(allFilterAccounts);
  }, [router.asPath])

  return (
    <DCMenu
      emptyText={'No results.'}
      multiple
      options={accountOptions}
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
            value={accountFilter}
            autoFocus={false}
            leftElement={
              <InputLeftElement pointerEvents={'none'} w={28}>
                <SearchIcon w={16} color={'readable.secondary'} />
              </InputLeftElement>
            }
            placeholder="Search"
            onChange={(e) => setAccountFilter(e.target.value)}
          />
        </MenuHeader>
      )}
      renderFooter={() => (
        <MenuFooter>
          {/* <Text onClick={() => setSelectedAccount(accountIds)}>Select All</Text> */}
          <Text onClick={() => setSelectedAccount([])}>Clear All</Text>
        </MenuFooter>
      )}
      renderOption={({ label, value }) => (
        <DCCheckbox
          checked={selectedAccount.includes(value)}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedAccount(xor(selectedAccount, [value]));
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
          visibility={selectedAccountOptions.length ? 'visible' : 'hidden'}
          content={`${selectedAccountOptions.map((i) => i.label).join(', ')} ${
            selectedAccountOptions.length > 1 ? 'are' : 'is'
          } selected.`}
        >
          <MenuButton
            className={cn(
              { 'menu-open': isOpen, 'button-filtered': !!allFilterAccounts.length && !isOpen },
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
                    setSelectedAccount([]);
                    dispatch(setAllFilterAccounts([]));
                  }}
                  className={'icon-selected'}
                  w={24}
                  type={'error'}
                />
              </>
            }
          >
            {!selectedAccountOptions.length ? (
              'Account'
            ) : (
              <>
                {trimLongStr(selectedAccountOptions[0].label, 6, 6, 0)}{' '}
                <Badge>{allFilterAccounts.length}</Badge>
              </>
            )}
          </MenuButton>
        </Tooltip>
      )}
    </DCMenu>
  );
};
