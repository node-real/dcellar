import { Box, FormErrorMessage } from '@totejs/uikit';
import { memo } from 'react';

interface ErrorDisplayProps {
  errorMsgs: string[];
}

export const ErrorDisplay = memo<ErrorDisplayProps>(function ErrorDisplay({ errorMsgs }) {
  if (errorMsgs.length === 1) {
    return (
      <FormErrorMessage fontSize={'14px'} color={'#EE3911'} textAlign={'left'} marginTop={'6px'}>
        {errorMsgs[0]}
      </FormErrorMessage>
    );
  }
  return (
    <Box as={'ul'} listStyleType={'disc'} marginTop={'6px'} listStylePosition={'inside'}>
      {errorMsgs.map((msg, index) => {
        if (msg === '') {
          return null;
        }
        return (
          <FormErrorMessage
            key={index}
            marginTop={0}
            lineHeight={'17px'}
            fontSize={'14px'}
            color={'#EE3911'}
            marginLeft={'4px'}
            as="li"
            listStyleType={'disc'}
            textAlign={'left'}
          >
            {msg}
          </FormErrorMessage>
        );
      })}
    </Box>
  );
});
