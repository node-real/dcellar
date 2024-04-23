import React, { memo } from 'react';
import { ObjectVersion } from '@/store/slices/object';
import { Box, Link, Loading } from '@node-real/uikit';
import { ListEmpty } from '@/components/common/DCTable/ListEmpty';
import styled from '@emotion/styled';
import dayjs from 'dayjs';
import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { trimAddress } from '@/utils/string';
import { CopyText } from '@/components/common/CopyText';

interface VersionTableProps {
  loading: boolean;
  versions: ObjectVersion[];
}

export const VersionTable = memo<VersionTableProps>(function VersionTable({
  loading,
  versions = [],
}) {
  if (loading) return <Loading w={'100%'} my={24} size={24} />;

  if (!versions.length)
    return (
      <ListEmpty
        empty
        h={240}
        type="empty-object"
        title="No Records"
        desc="There are no records at the moment."
      />
    );

  return (
    <Box borderRadius={4} border={'1px solid readable.border'}>
      <TR>
        <TH>Version</TH>
        <TH>Date</TH>
        <TH>Transaction</TH>
      </TR>
      {versions.map((version, index) => (
        <TR key={index}>
          <TD>{version.Version}</TD>
          <TD>{dayjs(version.ContentUpdatedAt * 1000).format('MMM D, YYYY HH:mm:ss A')}</TD>
          <TD>
            <CopyText value={version.TxHash}>
              <Link
                target="_blank"
                color="#1184EE"
                cursor={'pointer'}
                textDecoration={'underline'}
                _hover={{
                  color: '#3C9AF1',
                }}
                href={`${GREENFIELD_CHAIN_EXPLORER_URL}/tx/${version.TxHash}`}
                fontSize={'14px'}
                lineHeight={'17px'}
                fontWeight={500}
              >
                {trimAddress(version.TxHash, 28, 6, 5)}
              </Link>
            </CopyText>
          </TD>
        </TR>
      ))}
    </Box>
  );
});

const TR = styled(Box)`
  display: flex;
  align-items: center;

  &:not(:last-child) {
    border-bottom: 1px solid var(--ui-colors-readable-border);
  }
`;

const TD = styled(Box)`
  padding: 8px 12px;
  font-size: 14px;

  &:nth-of-type(1) {
    width: 100px;
  }

  &:nth-of-type(2) {
    width: 240px;
  }

  &:nth-of-type(3) {
    flex: 1;
  }
`;

const TH = styled(TD)`
  font-size: 12px;
  font-weight: 500;
  background: var(--ui-colors-bg-bottom);
`;
