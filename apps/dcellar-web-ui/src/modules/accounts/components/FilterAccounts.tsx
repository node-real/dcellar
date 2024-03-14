import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { DCCheckbox } from '@/components/common/DCCheckbox';
import { DCMenu } from '@/components/common/DCMenu';
import { MenuOption } from '@/components/common/DCMenuList';
import { InputItem } from '@/components/formitems/InputItem';
import { useAppDispatch, useAppSelector } from '@/store';
import { setAllFilterAccounts } from '@/store/slices/billing';
import { trimLongStr } from '@/utils/string';
import { SearchIcon } from '@node-real/icons';
import { InputLeftElement, MenuButton, Text, Tooltip } from '@node-real/uikit';
import cn from 'classnames';
import { keyBy, xor } from 'lodash-es';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAccountList } from '../hooks';
import { Badge, MenuFooter, MenuHeader } from './Common';

export const FilterAccounts = () => {
  const dispatch = useAppDispatch();
  const billAccountFilter = useAppSelector((root) => root.billing.billAccountFilter);

  const router = useRouter();
  const [accountFilter, setAccountFilter] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Array<string>>([]);
  const accountList = useAccountList();
  const keyAccountList = keyBy(accountList, 'id');

  const accountIds = accountList
    .filter((account) =>
      !accountFilter.trim()
        ? true
        : account.name.toLowerCase().includes(accountFilter.trim().toLowerCase()) ||
          account.address.toLowerCase().includes(accountFilter.trim().toLowerCase()),
    )
    .map((item) => item.id);

  const idToOptions = (id: string) => ({
    label: keyAccountList[id]?.name,
    value: id,
    address: keyAccountList[id]?.address,
  });

  const accountOptions: MenuOption[] = accountIds.map(idToOptions);
  const selectedAccountOptions = billAccountFilter.map(idToOptions);

  const accountClose = () => {
    dispatch(setAllFilterAccounts(selectedAccount));
  };

  const accountOpen = () => {
    setSelectedAccount(billAccountFilter);
  };

  useEffect(() => {
    setSelectedAccount(billAccountFilter);
  }, [router.asPath]);

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
              { 'menu-open': isOpen, 'button-filtered': !!billAccountFilter.length && !isOpen },
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
                <Badge>{billAccountFilter.length}</Badge>
              </>
            )}
          </MenuButton>
        </Tooltip>
      )}
    </DCMenu>
  );
};
