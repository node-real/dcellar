import { useRouter } from 'next/router';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, Text } from '@totejs/uikit';
import Head from 'next/head';
import Link from 'next/link';

import { File } from '@/modules/file';
import { GAClick } from '@/components/common/GATracker';

const Folder = () => {
  const router = useRouter();
  const { bucketName } = router.query;
  let finalBucketName = '';
  let finalFolderName='';
  let folderNameArray = [] as string[];
  if (typeof bucketName === 'string') {
    finalBucketName = bucketName;
  } else if (Array.isArray(bucketName)) {
    finalBucketName = bucketName[0];
    folderNameArray = bucketName.slice(1);
    finalFolderName=folderNameArray.join('/')+'/';
  }

  const renderBreadcrumbItem = (isLastItem: boolean, link: string, text: string) => {
    if (isLastItem) {
      return (
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink color={'readable.normal'} fontWeight={600}>
            <Text fontWeight={900}>{text}</Text>
          </BreadcrumbLink>
        </BreadcrumbItem>
      );
    }
    return (
      <BreadcrumbItem>
        <BreadcrumbLink>
          <GAClick name="dc.file.list.breadcrumbs.click">
            <Link href={link}>{text}</Link>
          </GAClick>
        </BreadcrumbLink>
      </BreadcrumbItem>
    );
  };

  const renderFolderBreadcrumb = () => {
    if (folderNameArray.length === 0) return;
    console.log('folderNameArray', folderNameArray);
    return folderNameArray.map((v, i) => {
      const isLastItem = i == folderNameArray.length - 1;
      return renderBreadcrumbItem(
        isLastItem,
        `/buckets/${finalBucketName}/${folderNameArray.slice(0, i + 1).join('/')}`,
        v,
      );
    });
  };
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
          {renderBreadcrumbItem(
            folderNameArray.length === 0,
            `/buckets/${finalBucketName}`,
            finalBucketName,
          )}
          {renderFolderBreadcrumb()}
        </Breadcrumb>
        <File bucketName={finalBucketName as string} folderName={finalFolderName}/>
      </Flex>
    </>
  );
};

export default Folder;
