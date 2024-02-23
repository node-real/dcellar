import { Box } from '@node-real/uikit';

import { H1, SubTitle } from './Common';

import { smMedia } from '@/modules/responsive';

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
        With our pricing calculator, you can easily get an estimate for your project on{' '}
        <strong>BNB Greenfield Mainnet</strong>.
      </SubTitle>
    </Box>
  );
};
