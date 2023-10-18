import { Fragment, memo } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, Text } from '@totejs/uikit';
import { GAClick } from '@/components/common/GATracker';
import Link from 'next/link';
import { encodeObjectName, trimLongStr } from '@/utils/string';
import { useAppSelector } from '@/store';
import { IconFont } from '@/components/IconFont';

interface ObjectBreadcrumbProps {}

export const ObjectBreadcrumb = memo<ObjectBreadcrumbProps>(function ObjectBreadcrumb({}) {
  const { discontinue } = useAppSelector((root) => root.bucket);
  const { bucketName, folders } = useAppSelector((root) => root.object);
  const items = [bucketName, ...folders];

  const renderBreadcrumbItem = (link: string, text: string, last: boolean, first: boolean) => {
    return last ? (
      <Fragment key="last">
        <Flex
          alignItems={'center'}
          gap={4}
          fontSize={12}
          fontWeight={500}
          as="li"
          flex={1}
          minW={0}
        >
          {discontinue && first && <IconFont type="colored-error2" w={16} />}
          <Text fontWeight={500} as="span" overflow="hidden" textOverflow="ellipsis">
            {text}
          </Text>
        </Flex>
      </Fragment>
    ) : (
      <BreadcrumbItem key={link}>
        <BreadcrumbLink as="div" fontSize={12} fontWeight={500} color="readable.tertiary">
          <Flex alignItems={'center'} gap={4} as="span">
            {discontinue && first && <IconFont type="colored-error2" w={16} />}
            <GAClick name="dc.file.list.breadcrumbs.click">
              <Link href={link}>{trimLongStr(text, 16, 16, 0)}</Link>
            </GAClick>
          </Flex>
        </BreadcrumbLink>
      </BreadcrumbItem>
    );
  };

  const renderBreadcrumb = () => {
    return items.map((i, index) => {
      const link = items.slice(0, index + 1).join('/');
      return renderBreadcrumbItem(
        encodeObjectName(link),
        i,
        index === items.length - 1,
        index === 0,
      );
    });
  };

  return (
    <Breadcrumb maxItems={5} maxW={700} whiteSpace="nowrap">
      <BreadcrumbItem>
        <BreadcrumbLink as="div" fontWeight={500} fontSize={12} color="readable.tertiary">
          <GAClick name="dc.file.list.breadcrumbs.click">
            <Link href="/buckets">Bucket</Link>
          </GAClick>
        </BreadcrumbLink>
      </BreadcrumbItem>
      {renderBreadcrumb()}
    </Breadcrumb>
  );
});
