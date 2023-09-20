import { smMedia } from '@/modules/responsive';
import { Box } from '@totejs/uikit';
import { H1, SubTitle } from './Common';
import { networkTag } from '@/utils/common';
import { runtimeEnv } from '@/base/env';

export const Banner = () => {
  return (
    <Box
      marginY={40}
      textAlign={'center'}
      marginX={'20px'}
      sx={{
        [smMedia]: {
          marginY: '20px',
        },
      }}
    >
      <H1>BNB Greenfield Pricing Calculator</H1>
      <SubTitle>
        With our pricing calculator, you can easily get an estimate for your project on BNB
        Greenfield{networkTag(runtimeEnv)}.
      </SubTitle>
    </Box>
  );
};
