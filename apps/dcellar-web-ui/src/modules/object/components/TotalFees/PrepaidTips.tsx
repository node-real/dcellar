import { Tips } from '@/components/common/Tips';
import { PREPAID_FEE_DOC } from '@/modules/file/constant';
import { Box, Link } from '@totejs/uikit';

export const PrePaidTips = () => {
  return (
    <Tips
      w={260}
      tips={
        <Box>
          <Box>Prepaid fee for six months and will be charged based on the flow rate.</Box>
          <Box textAlign={'right'}>
            <Link cursor={'pointer'} textDecoration={'underline'} href={PREPAID_FEE_DOC} target='_blank'>
              Learn more
            </Link>
          </Box>
        </Box>
      }
    />
  );
};
