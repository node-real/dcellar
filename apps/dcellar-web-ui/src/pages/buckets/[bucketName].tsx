import { useRouter } from 'next/router';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, Text } from '@totejs/uikit';
import Head from 'next/head';
import Link from 'next/link';

import { File } from '@/modules/file';
import { GAClick } from '@/components/common/GATracker';

const Post = () => {
  const router = useRouter();
  const { bucketName } = router.query;

  return (
    <>
      <Head>
        <title>{bucketName} - DCellar</title>
      </Head>
      <Flex flexDirection={'column'} w={'100%'} height="100%">
        <Breadcrumb marginX="16px" marginTop="16px">
          <BreadcrumbItem>
            <BreadcrumbLink>
              <GAClick name="dc.file.list.breadcrumbs.click">
                <Link href="/buckets">Bucket</Link>
              </GAClick>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage fontWeight={'900'}>
            <BreadcrumbLink href="#" color={'readable.normal'} fontWeight={600}>
              <Text fontWeight={900}>{bucketName}</Text>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <File bucketName={bucketName as string} />
      </Flex>
    </>
  );
};

export default Post;
