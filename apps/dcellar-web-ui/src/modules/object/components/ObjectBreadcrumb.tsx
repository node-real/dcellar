import { IconFont } from '@/components/IconFont';
import { GAClick } from '@/components/common/GATracker';
import { useAppDispatch, useAppSelector } from '@/store';
import { setObjectShareModePath } from '@/store/slices/object';
import { encodeObjectName, trimLongStr } from '@/utils/string';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, Text } from '@node-real/uikit';
import Link from 'next/link';
import { Fragment, memo } from 'react';

interface ObjectBreadcrumbProps {
  hideLeft?: number;
}

export const ObjectBreadcrumb = memo<ObjectBreadcrumbProps>(function ObjectBreadcrumb({
  hideLeft,
}) {
  const dispatch = useAppDispatch();
  const isBucketDiscontinue = useAppSelector((root) => root.bucket.isBucketDiscontinue);
  const currentBucketName = useAppSelector((root) => root.object.currentBucketName);
  const pathSegments = useAppSelector((root) => root.object.pathSegments);

  const items = [currentBucketName, ...pathSegments];

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
          {isBucketDiscontinue && first && <IconFont type="colored-error2" w={16} />}
          <Text fontWeight={500} as="span" overflow="hidden" textOverflow="ellipsis">
            {text}
          </Text>
        </Flex>
      </Fragment>
    ) : (
      <BreadcrumbItem key={link}>
        <BreadcrumbLink as="div" fontSize={12} fontWeight={500} color="readable.tertiary">
          <Flex alignItems={'center'} gap={4} as="span">
            {isBucketDiscontinue && first && <IconFont type="colored-error2" w={16} />}
            <GAClick name="dc.file.list.breadcrumbs.click">
              <Link
                href={link}
                onClick={(e) => {
                  if (hideLeft !== undefined) {
                    e.stopPropagation();
                    e.preventDefault();
                    dispatch(setObjectShareModePath(link));
                  }
                }}
              >
                {trimLongStr(text, 16, 16, 0)}
              </Link>
            </GAClick>
          </Flex>
        </BreadcrumbLink>
      </BreadcrumbItem>
    );
  };

  const renderBreadcrumb = () => {
    const res = items.map((i, index) => {
      const link = items.slice(0, index + 1).join('/');
      return renderBreadcrumbItem(
        encodeObjectName(link),
        i,
        index === items.length - 1,
        index === 0,
      );
    });
    if (hideLeft === undefined) return res;
    return res.slice(hideLeft);
  };

  return (
    <Breadcrumb maxItems={5} maxW={700} whiteSpace="nowrap">
      {hideLeft === undefined && (
        <BreadcrumbItem>
          <BreadcrumbLink as="div" fontWeight={500} fontSize={12} color="readable.tertiary">
            <GAClick name="dc.file.list.breadcrumbs.click">
              <Link href="/buckets">Bucket</Link>
            </GAClick>
          </BreadcrumbLink>
        </BreadcrumbItem>
      )}
      {renderBreadcrumb()}
    </Breadcrumb>
  );
});
