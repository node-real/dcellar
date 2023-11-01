import { memo } from 'react';
import { Flex, InputLeftElement } from '@totejs/uikit';
import { InputItem } from '@/components/formitems/InputItem';
import { SearchIcon } from '@totejs/icons';
import styled from '@emotion/styled';
import { useAppDispatch, useAppSelector } from '@/store';
import { setFilterExpand, setFilterText } from '@/store/slices/object';
import { DCButton } from '@/components/common/DCButton';
import { IconFont } from '@/components/IconFont';
import cn from 'classnames';

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
        autoFocus={false}
        leftElement={
          <InputLeftElement pointerEvents={'none'}>
            <SearchIcon ml={4} w={24} color={'readable.tertiary'} />
          </InputLeftElement>
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
