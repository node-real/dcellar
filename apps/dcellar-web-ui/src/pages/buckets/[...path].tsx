import { useRouter } from 'next/router';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, Text } from '@totejs/uikit';
import Head from 'next/head';
import Link from 'next/link';
import WaringTriangleIcon from '@/public/images/icons/warning-triangle.svg';

import { File } from '@/modules/file';
import { GAClick } from '@/components/common/GATracker';
import { Fragment, useEffect, useState } from 'react';
import { getBucketInfo } from '@/utils/sp';
import { encodeObjectName, trimLongStr } from '@/utils/string';

const Folder = () => {
  const router = useRouter();
  const { path } = router.query;
  const [bucketInfo, setBucketInfo] = useState<any>({});
  const [bucketName, ...folders] = path as string[];
  const folderPath = folders.join('/') + '/';

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

  const renderBreadcrumbItem = (
    isLastItem: boolean,
    link: string,
    text: string,
    key: number,
    bucket = false,
  ) => {
    if (isLastItem) {
      return (
        <Fragment key="last">
          <Flex alignItems={'center'} gap={4} fontWeight={600} as="li" flex={1} minW={0}>
            {isDiscontinued && bucket && <WaringTriangleIcon />}
            <Text fontWeight={900} as="span" overflow="hidden" textOverflow="ellipsis">
              {text}
            </Text>
          </Flex>
        </Fragment>
      );
    }
    return (
      <BreadcrumbItem key={key}>
        <BreadcrumbLink as="div">
          <Flex alignItems={'center'} gap={4} as="span">
            {isDiscontinued && bucket && <WaringTriangleIcon />}
            <GAClick name="dc.file.list.breadcrumbs.click">
              <Link href={link}>{trimLongStr(text, 16, 16, 0)}</Link>
            </GAClick>
          </Flex>
        </BreadcrumbLink>
      </BreadcrumbItem>
    );
  };

  const renderFolderBreadcrumb = () => {
    if (!folders.length) return;
    return folders.map((v, i) => {
      const isLastItem = i == folders.length - 1;
      return renderBreadcrumbItem(
        isLastItem,
        `/buckets/${bucketName}/${encodeObjectName(folders.slice(0, i + 1).join('/'))}`,
        v,
        i,
      );
    });
  };

  return (
    <>
      <Head>
        <title>{bucketName} - DCellar</title>
      </Head>
      <Flex flexDirection={'column'} w={'100%'} height="100%">
        <Breadcrumb marginX="16px" marginTop="16px" maxItems={5} maxW={700} whiteSpace="nowrap">
          <BreadcrumbItem>
            <BreadcrumbLink as="div">
              <GAClick name="dc.file.list.breadcrumbs.click">
                <Link href="/buckets">Bucket</Link>
              </GAClick>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {renderBreadcrumbItem(!folders.length, `/buckets/${bucketName}`, bucketName, -1, true)}
          {renderFolderBreadcrumb()}
        </Breadcrumb>
        <File
          bucketName={bucketName}
          folderName={!folders.length ? '' : folderPath}
          bucketInfo={bucketInfo}
        />
      </Flex>
    </>
  );
};

export default Folder;
