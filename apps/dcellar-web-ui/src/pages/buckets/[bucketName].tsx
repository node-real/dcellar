import { useRouter } from 'next/router';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, Text } from '@totejs/uikit';
import Head from 'next/head';
import Link from 'next/link';
import WaringTriangleIcon from '@/public/images/icons/warning-triangle.svg';

import { File } from '@/modules/file';
import { GAClick } from '@/components/common/GATracker';
import { useEffect, useState } from 'react';
import { getBucketInfo } from '@/utils/sp';

const Post = () => {
  const router = useRouter();
  const { bucketName } = router.query;
  const [bucketInfo, setBucketInfo] = useState<any>({});

  useEffect(() => {
    getBucketInfo(bucketName as string)
      .then((bucketInfo) => {
        setBucketInfo(bucketInfo);
      })
      .catch((err) => {
        console.log('err', err);
      });
  }, [bucketName]);
  const isDiscontinued = bucketInfo.bucketStatus === 1;

  return (
    <>
      <Head>
        <title>{bucketName} - DCellar</title>
      </Head>
      <Flex flexDirection={'column'} w={'100%'} height="100%">
        <Breadcrumb marginX="16px" marginTop="16px">
          <BreadcrumbItem>
            <GAClick name="dc.file.list.breadcrumbs.click">
              <BreadcrumbLink href="/buckets">Bucket</BreadcrumbLink>
            </GAClick>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage fontWeight={'900'}>
            <BreadcrumbLink color={'readable.normal'} fontWeight={600} as="div">
              {/* <Flex alignItems={'center'}> */}
              {isDiscontinued && <WaringTriangleIcon />}
              <Text fontWeight={900} marginLeft={'4px'} href="#" as="a">
                {bucketName}
              </Text>
              {/* </Flex> */}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <File bucketName={bucketName as string} bucketInfo={bucketInfo} />
      </Flex>
    </>
  );
};

export default Post;
