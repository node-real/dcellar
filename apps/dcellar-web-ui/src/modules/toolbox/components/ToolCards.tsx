import { Badge, Flex, Text } from '@node-real/uikit';

import { Card, CircleLink } from './Common';

import { IconFont } from '@/components/IconFont';
import { ToolItem } from '../config';

export const ToolCards = ({ data }: { data: ToolItem[] }) => {
  return (
    <>
      {data.map((item, index) => (
        <Card
          key={index}
          w={'100%'}
          as={'a'}
          // @ts-expect-error href is a valid prop when using as={'a'}
          href={item.links.find((t) => t.name === 'Link')?.url || ''}
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconFont type={item.icon || 'link'} w={48} />
          <Flex justifyContent={'space-between'} gap={8}>
            <Text fontSize={16} fontWeight={600} flex={1}>
              {item.title}
            </Text>
            {item.links &&
              item.links.map((link, i) => (
                <CircleLink key={i} title={link.name} href={link.url}>
                  <IconFont type={link.icon} w={16} />
                </CircleLink>
              ))}
          </Flex>

          <Badge colorScheme="primary" width={'fit-content'} borderRadius={4}>
            {item.badge}
          </Badge>
          <Text color={'readable.secondary'}>{item.desc}</Text>
        </Card>
      ))}
    </>
  );
};
