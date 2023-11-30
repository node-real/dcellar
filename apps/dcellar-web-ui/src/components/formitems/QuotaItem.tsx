import React, { memo, useEffect, useMemo, useState } from 'react';
import { Box, Flex, Text } from '@totejs/uikit';
import styled from '@emotion/styled';
import { Tips } from '@/components/common/Tips';
import { DCInputNumber } from '@/components/common/DCInputNumber';
import { DCTooltip } from '@/components/common/DCTooltip';
import { G_BYTES } from '@/constants/legacy';
import { selectStoreFeeParams, setupStoreFeeParams } from '@/store/slices/global';
import { useAppDispatch, useAppSelector } from '@/store';
import { formatByGB } from '@/utils/string';
import BigNumber from 'bignumber.js';
import { getTimestampInSeconds } from '@/utils/time';
import { BN } from '@/utils/math';
import { renderBnb } from '@/modules/object/utils';
import { displayTokenSymbol } from '@/utils/wallet';

const MAX_SIZE = 100000;

interface QuotaItemProps {
  value: number;
  current?: number;
  onChange: (v: number) => void;
  quotaUpdateAt?: number;
}

const percentToValue = (percent: number) => {
  percent = percent < 0 ? 0 : percent > 100 ? 100 : percent;
  let value;
  if (percent <= 50) {
    value = (200 * percent) / 50;
  } else if (percent > 50 && percent <= 78) {
    value = 200 + (300 * (percent - 50)) / 38;
  } else {
    value = 500 + ((percent - 78) / 22) * (100000 - 500);
  }
  return BigNumber(value).dp(0).toNumber();
};

const valueToPercent = (value: number) => {
  let percent;
  if (value <= 200) {
    percent = (value / 200) * 50;
  } else if (value > 200 && value <= 500) {
    percent = ((value - 200) / 300) * 38 + 50;
  } else {
    percent = ((value - 500) / (100000 - 500)) * 22 + 78;
  }
  return Math.min(98, percent);
};

export const QuotaItem = memo<QuotaItemProps>(function QuotaItem({
  value,
  current,
  onChange,
  quotaUpdateAt,
}) {
  const dispatch = useAppDispatch();
  const [_, forceUpdate] = useState(0);
  const percent = valueToPercent(value);
  const title = formatByGB(value * G_BYTES).replace(' ', '');
  const originPercent = valueToPercent(current || 0);
  const originValue = !current ? '0GB' : formatByGB(current * G_BYTES).replace(' ', '');
  const { readPrice = 0 } = useAppSelector(selectStoreFeeParams);
  const [invalid, setInvalid] = useState(false);
  const overlayStyles = { color: '#fff', borderColor: invalid ? '#EE3911' : '#14151A' };

  useEffect(() => {
    if (!current || !quotaUpdateAt) return;
    const now = getTimestampInSeconds();
    const days = (now - quotaUpdateAt) / 86400;
    setInvalid(value < (current || 0) && days < 30);
  }, [value, current, quotaUpdateAt]);

  useEffect(() => {
    dispatch(setupStoreFeeParams());
  }, [dispatch]);

  const onTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const elem = e.target as HTMLDivElement;
    const track = '#buy-quota-progress-bar > div:first-child';
    const child = '#buy-quota-progress-bar > div:first-child *';
    if (!elem.matches(`${track},${child}`)) return;
    const trackElem = document.querySelector(track) as HTMLDivElement;
    const { x, width } = trackElem.getBoundingClientRect();
    const { clientX } = e;
    const percent = ((clientX - x) / width) * 100;
    onChange(percentToValue(percent));
  };

  const onDragStart = () => {
    const container = document.getElementById('buy-quota-progress-bar')!;
    const movingClass = 'indicator-moving';

    container.classList.add(movingClass);
    document.body.style.cursor = 'pointer';
    document.body.style.userSelect = 'none';

    const mousemove = (e: MouseEvent) => {
      const { clientX } = e;
      const track = '#buy-quota-progress-bar > div:first-child';
      const trackElem = document.querySelector(track) as HTMLDivElement;
      const { x, width } = trackElem.getBoundingClientRect();
      const percent = ((clientX - x) / width) * 100;
      onChange(percentToValue(percent));
    };
    const mouseup = () => {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = '';
      container.classList.remove(movingClass);
      document.removeEventListener('mousemove', mousemove);
      document.removeEventListener('mouseup', mouseup);
      forceUpdate((v) => v + 1);
    };
    document.addEventListener('mousemove', mousemove);
    document.addEventListener('mouseup', mouseup);
  };

  const price = useMemo(() => {
    return BN(readPrice)
      .div(10 ** 18)
      .times(G_BYTES)
      .times(2_592_000)
      .div(10 ** 18)
      .toString();
  }, [readPrice]);

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
          Price: {renderBnb(price)} {displayTokenSymbol()}/GB/month
        </Text>
      </FormLabel>
      <Flex position="relative" alignItems="center" id="buy-quota-progress-bar">
        <Track onClick={onTrackClick}>
          {current !== undefined && (
            <ProgressOrigin w={`${originPercent}%`} minW={6}>
              <DCTooltip
                zIndex={1}
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
              zIndex={2}
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
              <Indicator bg={'#00ba34'} onMouseDown={onDragStart} />
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
            onKeyDown={(e) => {
              if (!e.key.match(/[0-9]|backspace|enter|delete|arrow(left|right|up|down)/i))
                e.preventDefault();
            }}
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
  cursor: pointer;

  .indicator-moving & {
    background: #009e2c;
  }
`;

const Progress = styled(Box)`
  background: #00ba34;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;

  .indicator-moving & {
    background: #009e2c;
  }
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
