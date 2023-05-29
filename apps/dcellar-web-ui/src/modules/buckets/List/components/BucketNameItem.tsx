import { Box, Flex, Text } from '@totejs/uikit'
import React from 'react'
import FileIcon from '@/public/images/icons/file.svg';
import { formatFullTime } from '@/modules/buckets/utils/formatTime';
import { DiscontinueNotice } from './DiscontinueNotice';


export const BucketNameItem = ({ info }: any) => {
  const {
    row: { original },
  } = info;
  const {
    delete_at,
    bucket_info: {
      bucket_status
    }
  } = original.originalData;
  const isContinued = bucket_status === 1;
  const estimateTime = formatFullTime(+delete_at * 1000 + 7 * 24 * 60 * 60 * 1000, 'YYYY-MM-DD HH:mm:ss');
  const content = `This item will be deleted by SP with an estimated time of ${estimateTime}. Please backup your data in time.`

  return (
    <Flex alignItems={'center'} mr={'8px'}>
      <Box width={'24px'}>
        <FileIcon color="inherit" />
      </Box>
      <Text
        marginX={'4px'}
        overflow={'hidden'}
        textOverflow={'ellipsis'}
        whiteSpace={'nowrap'}
        color="inherit"
        fontWeight={500}
      >
        {info.getValue()}
      </Text>
      {isContinued && <DiscontinueNotice content={content} learnMore={'https://docs.nodereal.io/docs/faq-1#question-what-is-discontinue'} />}
    </Flex>
  )
}
