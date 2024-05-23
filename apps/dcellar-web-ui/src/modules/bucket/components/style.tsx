import styled from '@emotion/styled';
import { Box, BoxProps, Flex, Text } from '@node-real/uikit';

export const Field = styled(Flex)`
  align-items: center;
  justify-content: space-between;
  margin: 8px 0;
  padding: 2px 0;
`;

// export const Label = styled.div`
//   font-weight: 500;
//   line-height: normal;
//   color: #76808f;
//   flex-shrink: 0;
//   width: 178px;
// `;
export const Label = ({ children, ...restProps }: BoxProps) => {
  return (
    <Box fontWeight={500} color={'readable.tertiary'} flex-shrink={0} width={178} {...restProps}>
      {children}
    </Box>
  );
};

export const Value = styled(Flex)`
  font-weight: 500;
  line-height: normal;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  align-items: center;
`;

export const ErrorText = styled(Text)`
  color: readable.danger;
  font-size: 12px;
  font-weight: 500;
`;
