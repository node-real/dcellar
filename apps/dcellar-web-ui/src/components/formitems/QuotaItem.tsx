import { memo, useEffect, useMemo } from 'react';
import { Box, Flex, Text } from '@totejs/uikit';
import styled from '@emotion/styled';
import { Tips } from '@/components/common/Tips';
import { DCInputNumber } from '@/components/common/DCInputNumber';
import { DCTooltip } from '@/components/common/DCTooltip';
import { renderBnb } from '@/modules/file/utils';
import { G_BYTES } from '@/utils/constant';
import { selectStoreFeeParams, setupStoreFeeParams } from '@/store/slices/global';
import { useAppDispatch, useAppSelector } from '@/store';
import { formatByGB } from '@/utils/string';
import { BN } from '@/utils/BigNumber';

const MAX_SIZE = 1024 * 1024;

interface QuotaItemProps {
  value: number;
  current?: number;
  onChange: (v: number) => void;
}

export const QuotaItem = memo<QuotaItemProps>(function QuotaItem({ value, current, onChange }) {
  const dispatch = useAppDispatch();
  const percent = Math.min(Math.floor((Math.min(value, 1024) / 1024) * 100), 98);
  const title = formatByGB(value * G_BYTES).replace(' ', '');
  const originPercent = Math.min(Math.floor((Math.min(current || 0, 1024) / 1024) * 100), 98);
  const originValue = !current ? '0GB' : formatByGB(current * G_BYTES).replace(' ', '');
  const { readPrice = 0 } = useAppSelector(selectStoreFeeParams);
  const invalid = value < (current || 0);
  const overlayStyles = { color: '#fff', borderColor: invalid ? '#EE3911' : '#14151A' };

  useEffect(() => {
    dispatch(setupStoreFeeParams());
  }, [dispatch]);

  const price = useMemo(
    () =>
      BN(readPrice)
        .div(10 ** 18)
        .times(G_BYTES)
        .times(2_592_000)
        .dividedBy(10 ** 18)
        .toString(),
    [readPrice],
  );

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
          Price: {renderBnb(price)} BNB/GB/month
        </Text>
      </FormLabel>

      <Flex alignItems="center">
        <Track id="buy-quota-progress-bar">
          {current !== undefined && (
            <ProgressOrigin w={`${originPercent}%`} minW={6}>
              <DCTooltip
                autoAdjustOverflow={false}
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
                overlayStyle={{
                  marginTop: '8px',
                }}
                color={'#fff'}
                placement={originPercent > 12 ? 'bottom' : 'bottomLeft'}
                getPopupContainer={() => document.getElementById('buy-quota-progress-bar')!}
              >
                <OriginIndicator />
              </DCTooltip>
            </ProgressOrigin>
          )}
          <Progress w={`${percent}%`} minW={6}>
            <DCTooltip
              key={invalid ? percent : current}
              color={invalid ? '#EE3911' : '#14151A'}
              open={current !== undefined || value > 0}
              title={
                invalid ? 'Lower quota cannot be set until 30 days after initial date.' : title
              }
              arrow={true}
              overlayInnerStyle={overlayStyles}
              getPopupContainer={() => document.getElementById('buy-quota-progress-bar')!}
            >
              <Indicator bg={value > 0 ? '#00ba34' : '#91E1A8'} />
            </DCTooltip>
          </Progress>
        </Track>
        <Flex flex={1} alignItems="center">
          <DCInputNumber
            value={value}
            onChange={(v) => onChange(v || 0)}
            controls={false}
            min={0}
            max={MAX_SIZE}
            precision={0}
            status={invalid ? 'error' : undefined}
          />
          <Text ml={8} fontSize={16} fontWeight={600} lineHeight="normal">
            GB/month
          </Text>
        </Flex>
      </Flex>
    </FormItem>
  );
});

const ProgressOrigin = styled(Box)`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #91e1a8;
`;

const OriginIndicator = styled(Box)`
  position: absolute;
  width: 0;
  height: 12px;
  border-right: 1px dashed #76808f;
  top: 10px;
  padding-left: 5px;
  margin-left: -5px;
  right: 0;
`;

const Indicator = styled(Box)`
  width: 14px;
  height: 14px;
  border: 3px solid #fff;
  border-radius: 100%;
  box-shadow: 0 0 0 1px #e6e8ea;
  position: absolute;
  right: -7px;
  top: -3px;
`;

const Progress = styled(Box)`
  background: #00ba34;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
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
    box-shadow: none !important;
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
