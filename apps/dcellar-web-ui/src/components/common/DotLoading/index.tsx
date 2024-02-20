import { Box } from '@node-real/uikit';
import React from 'react';

import styles from './DotLoading.module.css';

export const DotLoading = () => {
  return <Box className={styles['loading-dot']}></Box>;
};
