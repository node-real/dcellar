import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { CopyText } from '@/components/common/CopyText';
import { DCLink } from '@/components/common/DCLink';
import { getShortenWalletAddress } from '@/utils/wallet';
import styled from '@emotion/styled';
import { BoxProps, TextProps, Text, Box, Flex } from '@totejs/uikit';
import { TimeRangePickerProps } from 'antd';
import dayjs from 'dayjs';

export const CardContainer = ({ children, ...props }: BoxProps) => {
  return (
    <Box border={'1px solid readable.border'} borderRadius={4} padding={16} {...props}>
      {children}
    </Box>
  );
};
export const CardTitle = ({ children, ...props }: TextProps) => {
  return (
    <Text fontSize={16} fontWeight={700} {...props}>
      {children}
    </Text>
  );
};

export const CardTime = ({ children, ...props }: TextProps) => {
  return (
    <Text fontSize={12} fontWeight={500} color={'readable.tertiary'} {...props}>
      {children}
    </Text>
  );
};

export const CardCost = ({ children, ...props }: TextProps) => {
  return (
    <Text fontSize={24} fontWeight={700} {...props}>
      {children}
    </Text>
  );
};

export const SectionHeader = ({ children, ...props }: TextProps) => {
  return (
    <Text as={'h3'} fontSize={16} fontWeight={600} {...props}>
      {children}
    </Text>
  );
};

export const ShortTxCopy = ({ address }: { address: string }) => {
  const addressUrl = `${GREENFIELD_CHAIN_EXPLORER_URL}/account/${address}`;
  return (
    <CopyText value={address} boxSize={16} iconProps={{ mt: 2, color: 'readable.secondary' }}>
      <DCLink color="currentcolor" href={addressUrl} target="_blank">
        {getShortenWalletAddress(address)}
      </DCLink>
    </CopyText>
  );
};

export const FilterContainer = styled(Flex)`
  align-items: center;
  gap: 12px;

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

  .ant-input-number {
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

export const rangePresets: TimeRangePickerProps['presets'] = [
  { label: 'Current Month', value: [dayjs().startOf('month'), dayjs()] },
  { label: 'Last 3 Months', value: [dayjs().add(-3, 'month'), dayjs()] },
  { label: 'Last 6 Months', value: [dayjs().add(-6, 'month'), dayjs()] },
];

export const MenuHeader = styled(Flex)`
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

export const MenuFooter = styled(Flex)`
  font-weight: 500;
  justify-content: flex-end;
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

export const Badge = styled.span`
  height: 24px;
  min-width: 24px;
  padding: 0 3px;
  background: var(--ui-colors-bg-bottom);
  border-radius: 100%;
  color: var(--ui-colors-readable-normal);
  line-height: 24px;
`;
