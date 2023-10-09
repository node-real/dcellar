import { memo } from 'react';

interface GasFeeTipsProps {}

export const GasFeeTips = memo<GasFeeTipsProps>(function GasFeeTips() {
  return null;
  // return (
  //   <Tips
  //     w={260}
  //     tips={
  //       <Box>
  //         <Box>Pay by Owner Account</Box>
  //         <Box textAlign={'right'}>
  //           <Link
  //             cursor={'pointer'}
  //             textDecoration={'underline'}
  //             href={GAS_FEE_DOC}
  //             target="_blank"
  //           >
  //             Learn more
  //           </Link>
  //         </Box>
  //       </Box>
  //     }
  //   />
  // );
});
