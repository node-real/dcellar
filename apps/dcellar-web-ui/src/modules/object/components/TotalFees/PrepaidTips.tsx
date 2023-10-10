import { Tips } from '@/components/common/Tips';
import { PREPAID_FEE_DOC } from '@/modules/object/constant';
import { Box, Link } from '@totejs/uikit';
import { useAppSelector } from '@/store';
import { selectStoreFeeParams } from '@/store/slices/global';
import { displayTime } from '@/utils/common';
import { memo } from 'react';

interface PrePaidTipsProps {}

export const PrePaidTips = memo<PrePaidTipsProps>(function PrePaidTips() {
  const storeFeeParams = useAppSelector(selectStoreFeeParams);
  const reserveTime = displayTime(storeFeeParams?.reserveTime || 0);

  return (
    <Tips
      w={260}
      tips={
        <Box>
          <Box>Prepaid fee for {reserveTime} and will be charged based on the flow rate.</Box>
          <Box textAlign={'right'}>
            <Link
              cursor={'pointer'}
              textDecoration={'underline'}
              href={PREPAID_FEE_DOC}
              target="_blank"
            >
              Learn more
            </Link>
          </Box>
        </Box>
      }
    />
  );
});
