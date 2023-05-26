import { Box, Flex, Text } from '@totejs/uikit'
import React from 'react'
import FileIcon from '@/public/images/icons/file.svg';
import { formatFullTime } from '@/modules/buckets/utils/formatTime';
import { DiscontinueNotice } from './DiscontinueNotice';


export const BucketNameItem = ({ info }: any) => {
  const {
    row: { original },
  } = info;
  console.log('rowData-bucketName', original);
  const {
    update_at,
    update_time,
    bucket_info: {
      bucket_status
    }
  } = original.originalData;
  const isContinued = bucket_status === 1;
  const estimateBlockHeight = +update_at + 7 * 24 * 60 * 60/2 ;
  const estimateTime = formatFullTime(+update_time * 1000 + 7 * 24 * 60 * 60 * 1000, 'YYYY-MM-DD HH:mm:ss');
  const content = `This item will be deleted by SP at block height ${estimateBlockHeight} (estimated time is ${estimateTime}). Please backup your data in time.`

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
