import { useAppSelector } from '@/store';
import { Flex, Text } from '@node-real/uikit';
import { TD } from './style';
import { DCTooltip } from '@/components/common/DCTooltip';
import { formatBytes } from '@/utils/formatter';
import { ErrorBadge } from './ErrorBadge';
import { memo } from 'react';

interface OptionItemProps {
  address: string;
  name: string;
  endpoint: string;
  access: boolean;
  status: number;
}

export const OptionItem = memo(function OptionItem({
  address,
  name,
  endpoint,
  access,
  status,
}: OptionItemProps) {
  const spMetaRecords = useAppSelector((root) => root.sp.spMetaRecords);
  const spLatencyRecords = useAppSelector((root) => root.sp.spLatencyRecords);
  const meta = spMetaRecords[endpoint];
  const spLatency = spLatencyRecords[endpoint.toLowerCase()] || 0;
  const textColor = access ? 'readable.secondary' : 'readable.disable';
  const tooltipColor = access ? 'tertiary' : 'disable';

  return (
    <Flex key={address} alignItems="center" cursor={access ? 'pointer' : 'not-allowed'}>
      <TD
        w={251}
        key={address}
        display="flex"
        flexDir="column"
        alignItems="flex-start"
        whiteSpace="normal"
        color={textColor}
      >
        <Flex alignItems="center" w="100%">
          <Text
            maxW="max-content"
            minW={0}
            flex={1}
            lineHeight="17px"
            fontSize={14}
            fontWeight={400}
            w="100%"
            color={textColor}
            noOfLines={1}
          >
            {name}
          </Text>
          <ErrorBadge access={access} address={address} status={status} />
        </Flex>

        <DCTooltip title={endpoint} placement="bottomLeft">
          <Text
            lineHeight="14px"
            wordBreak="break-all"
            fontSize={12}
            transformOrigin="0 50%"
            transform={'scale(0.85)'}
            fontWeight={400}
            color={tooltipColor}
            noOfLines={1}
          >
            {endpoint}
          </Text>
        </DCTooltip>
      </TD>
      <TD w={120} color={textColor}>
        {meta ? formatBytes(meta.FreeReadQuota) : '--'}
      </TD>
      <TD $dot={access ? spLatency : 0} color={textColor}>
        {access && spLatency ? `${spLatency}ms` : '--'}
      </TD>
    </Flex>
  );
});
