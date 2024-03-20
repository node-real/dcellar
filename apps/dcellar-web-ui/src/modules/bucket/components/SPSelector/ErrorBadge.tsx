import { GREENFIELD_CHAIN_EXPLORER_URL } from '@/base/env';
import { IconFont } from '@/components/IconFont';
import { DCTooltip } from '@/components/common/DCTooltip';
import { Status as StorageProviderStatus } from '@bnb-chain/greenfield-cosmos-types/greenfield/sp/types';
import { ExternalLinkIcon } from '@node-real/icons';
import { Badge } from '@node-real/uikit';
import { A } from './style';
import { capitalize } from 'radash';
import { memo } from 'react';

type ErrorBadgeProps = {
  access: boolean;
  address: string;
  status: number;
};

export const ErrorBadge = memo(function ErrorBadge({ access, address, status }: ErrorBadgeProps) {
  const renderUnavailableBadge = () => (
    <DCTooltip title="Check reasons in documentations" placement="bottomLeft">
      <Badge
        as="a"
        target="_blank"
        href="https://docs.nodereal.io/docs/dcellar-faq#storage-provider-related"
        ml={4}
        colorScheme="danger"
        cursor="pointer"
        _hover={{
          color: 'scene.danger.normal',
        }}
      >
        SP Error <ExternalLinkIcon boxSize={12} ml={2} />
      </Badge>
    </DCTooltip>
  );

  const renderStatusBadge = () => {
    const statusText = (StorageProviderStatus[status] || 'Unknown')
      .replace('STATUS_', '')
      .split('_')
      .map((s) => capitalize(s))
      .join(' ');

    return (
      <Badge ml={4} colorScheme="danger">
        {statusText}
      </Badge>
    );
  };

  const renderAccessIcon = () => (
    <A
      href={`${GREENFIELD_CHAIN_EXPLORER_URL}/account/${address}`}
      target="_blank"
      onClick={(e) => e.stopPropagation()}
    >
      <IconFont type="external" w={12} />
    </A>
  );

  if (!access) {
    if (status === 0) {
      return renderUnavailableBadge();
    } else {
      return renderStatusBadge();
    }
  } else {
    return renderAccessIcon();
  }
});
