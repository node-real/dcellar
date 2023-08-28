import { memo } from 'react';
import { Box, Flex, Text } from '@totejs/uikit';
import styled from '@emotion/styled';
import { Tips } from '@/components/common/Tips';
import { DCInputNumber } from '@/components/common/DCInputNumber';
import { DCTooltip } from '@/components/common/DCTooltip';
import { formatBytes } from '@/modules/file/utils';
import { G_BYTES } from '@/utils/constant';

const MAX_SIZE = 1024 * 1024;

interface QuotaItemProps {
  value: number;
  current?: number;
  onChange: (v: number) => void;
}

export const QuotaItem = memo<QuotaItemProps>(function QuotaItem({ value, current, onChange }) {
  const percent = Math.floor((Math.min(value, 1024) / 1024) * 100);
  const title = formatBytes(value * G_BYTES).replace(' ', '');
  const overlayStyles = { color: '#fff', borderColor: '#14151A' };
  const originPercent = Math.min(Math.floor((Math.min(current || 0, 1024) / 1024) * 100), 96.4);
  const originValue = !current ? '0GB' : formatBytes(current * G_BYTES).replace(' ', '');

  return (
    <FormItem>
      <FormLabel>
        <Flex>
          Monthly Download Quota{' '}
          <Tips
            placement="bottom-start"
            tips="Monthly quota will renewed automatically and can’t be downgraded until 30 days after the initial date."
          />
        </Flex>
        <Text color="#76808F" fontWeight={400}>
          Price: 0.01002 BNB/GB/month
        </Text>
      </FormLabel>

      <Flex alignItems="center">
        <Track>
          <Progress w={`${percent}%`} minW={6} />
          <DCTooltip
            color="#14151A"
            zIndex={1300}
            open={value > 0}
            title={title}
            arrow={true}
            overlayInnerStyle={overlayStyles}
          >
            <Indicator bg={value > 0 ? '#00ba34' : '#91E1A8'} />
          </DCTooltip>
          {current !== undefined && (
            <DCTooltip
              zIndex={1300}
              autoAdjustOverflow={false}
              arrow={true}
              open={true}
              title={
                <>
                  <Text color="#76808F" fontSize={12}>
                    Current Quota
                  </Text>
                  <Text fontSize={12} align="center">
                    {originValue}
                  </Text>
                </>
              }
              color={'#fff'}
              placement={'bottom'}
            >
              <OriginIndicator left={`${originPercent}%`} />
            </DCTooltip>
          )}
        </Track>
        <Flex flex={1} alignItems="center">
          <DCInputNumber
            value={value}
            onChange={(v) => onChange(v || 0)}
            controls={false}
            min={0}
            max={MAX_SIZE}
            precision={0}
          />
          <Text ml={8} fontSize={16} fontWeight={600} lineHeight="normal">
            GB/month
          </Text>
        </Flex>
      </Flex>
    </FormItem>
  );
});

const OriginIndicator = styled(Box)`
  position: absolute;
  width: 1px;
  height: 12px;
  background-color: #1e2026;
  top: -2px;
  margin-left: 5px;
`;

const Indicator = styled(Box)`
  width: 14px;
  height: 14px;
  border: 3px solid #fff;
  border-radius: 100%;
  box-shadow: 0 0 0 1px #e6e8ea;
  margin-left: -7px;
`;

const Progress = styled(Box)`
  background: #00ba34;
  height: 100%;
`;

const Track = styled(Flex)`
  width: 341px;
  margin-right: 8px;
  height: 8px;
  background: #f5f5f5;
  align-items: center;
  position: relative;
`;

const FormItem = styled.div`
  margin: 48px 0;
  .ant-input-number {
    width: 84px;
    box-shadow: none;
  }
  .ant-input-number .ant-input-number-input {
    font-weight: 500;
    height: 23px;
    text-align: right;
  }
`;

const FormLabel = styled(Flex)`
  align-items: center;
  font-weight: 500;
  line-height: normal;
  justify-content: space-between;
  margin-bottom: 24px;
`;
