import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { InputItem } from '@/components/formitems/InputItem';
import { useAppDispatch, useAppSelector } from '@/store';
import { setFilterExpand, setFilterText } from '@/store/slices/object';
import styled from '@emotion/styled';
import { SearchIcon } from '@node-real/icons';
import { Flex, InputLeftElement, InputRightElement } from '@node-real/uikit';
import cn from 'classnames';
import { memo } from 'react';

interface ObjectListFilterProps {}

export const ObjectListFilter = memo<ObjectListFilterProps>(function ObjectListFilter() {
  const filterExpand = useAppSelector((root) => root.object.filterExpand);
  const { filterText, filterTypes, filterSizeTo, filterSizeFrom, filterRange } = useAppSelector(
    (root) => root.object,
  );
  const dispatch = useAppDispatch();
  const account = (() => {
    let _account = 0;
    if (filterTypes.length) _account++;
    if (filterRange?.[0] || filterRange?.[1]) _account++;
    if (filterSizeTo.value || filterSizeFrom.value) _account++;
    return _account;
  })();

  return (
    <Container>
      <InputItem
        className={'object-list-search'}
        autoFocus={false}
        leftElement={
          <InputLeftElement pointerEvents={'none'}>
            <SearchIcon ml={4} w={24} color={'readable.tertiary'} />
          </InputLeftElement>
        }
        rightElement={
          <InputRightElement>
            {filterText && (
              <IconFont
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(setFilterText(''));
                  const input = document.querySelector<HTMLInputElement>('.object-list-search');
                  if (!input) return;
                  input.focus();
                }}
                cursor={'pointer'}
                className={'icon-selected'}
                w={24}
                _hover={{
                  color: 'brand.brand6',
                }}
                type={'error'}
              />
            )}
          </InputRightElement>
        }
        placeholder="Search objects or folders"
        value={filterText}
        onChange={(e) => dispatch(setFilterText(e.target.value))}
      />
      <DCButton
        className={cn({
          'filter-expand': filterExpand,
          'filter-expand-button': !filterExpand && account > 0,
        })}
        variant="ghost"
        leftIcon={<IconFont w={24} type="filter" />}
        onClick={() => dispatch(setFilterExpand(!filterExpand))}
      >
        {!filterExpand && account > 0 && <Badge>{account}</Badge>}
      </DCButton>
    </Container>
  );
});

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
  gap: 12px;
  align-items: center;

  .ui-input-group {
    flex: 1;

    :hover {
      .ui-input {
        border-color: var(--ui-colors-scene-primary-normal);
      }
    }
  }

  .ui-input {
    width: 280px;
    height: 40px;
    background: transparent;
    font-weight: 500;
    font-size: 14px;
  }

  .filter-expand {
    border-color: var(--ui-colors-brand-brand6);
    color: var(--ui-colors-brand-brand6);

    :hover {
      background: var(--ui-colors-opacity1);
    }
  }

  .filter-expand-button {
    width: 72px;
    gap: 6px;
  }
`;
