import React from 'react';
import { Box, Flex, Image, Text } from '@totejs/uikit';

import { assetPrefix } from '@/base/env';
import { Tips } from '@/components/common/Tips';
import { NewBucket } from '@/modules/buckets/List/components/NewBucket';

export const Empty = ({ refetch }: any) => {
  return (
    <Flex flex={1} flexDirection={'column'} alignItems={'center'} justifyContent="center">
      <Image
        src={`${assetPrefix}/images/buckets/creating-bucket.svg`}
        w="120px"
        h="120px"
        alt="create bucket image"
        marginTop="-104px"
      />
      <Flex marginBottom={'24px'} marginTop={'6px'}>
        <Text fontSize={'14px'} fontWeight={500} lineHeight={'24px'} color={'readable.tertiary'}>
          Create a bucket to get started!👏
        </Text>
        <Tips
          iconSize="16px"
          containerWidth={'304px'}
          placement={'bottom-start'}
          tips={
            <Box>
              Every object in BNB Greenfield is stored in a bucket. To upload objects to BNB Greenfield,
              you'll need to create a bucket where the objects will be stored.
            </Box>
          }
        />
      </Flex>

      <NewBucket
        refetch={refetch}
        gaClickName="dc.bucket.empty.newbucket.click"
        gaShowName="dc.bucket.empty.newbucket.show"
      />
    </Flex>
  );
};
