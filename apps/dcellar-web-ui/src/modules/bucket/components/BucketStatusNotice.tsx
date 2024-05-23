import { IconFont } from '@/components/IconFont';
import { DCLink } from '@/components/common/DCLink';
import { Box, Divider, Flex, Menu, MenuButton, MenuList, Text } from '@node-real/uikit';

type InvalidStatusReason = {
  title: string;
  desc: string;
  link?: string;
  icon: string;
  show: boolean;
};
export const BucketStatusNotice = ({
  flowRateLimit = false,
  bucketStatusReason,
}: {
  flowRateLimit?: boolean;
  bucketStatusReason: {
    title: string;
    desc: string;
    link?: string;
    icon: string;
    show: boolean;
  } | null;
}) => {
  const account = bucketStatusReason && flowRateLimit ? 2 : 0;
  const discontinueReasons: InvalidStatusReason[] = [
    {
      icon: 'colored-error2',
      title: 'Flow rate exceeds limit',
      desc: "The bucket's flow rate exceeds the payment account limit. Contact the account owner or switch accounts to increase it.",
      link: 'https://docs.nodereal.io/docs/dcellar-faq#question-why-is-my-bucket-flow-rate-limited',
      show: flowRateLimit,
    },
    bucketStatusReason || { title: '', desc: '', icon: '', show: false },
  ].filter((i) => i.show);

  return (
    <Menu strategy="fixed" trigger="hover" placement="right-start">
      <>
        <MenuButton
          onClick={(e) => e.stopPropagation()}
          whiteSpace={'nowrap'}
          color={'#D9304E'}
          display={'flex'}
          alignItems={'center'}
          fontWeight={600}
        >
          <IconFont
            type={
              flowRateLimit
                ? 'colored-error2'
                : (bucketStatusReason && bucketStatusReason.icon) || 'colored-error2'
            }
            w={16}
          />
          {!!account && <>{account}</>}
        </MenuButton>
        <MenuList>
          <Box width={'280px'} padding="8px 12px" onClick={(e) => e.stopPropagation()}>
            {discontinueReasons.map(({ title, desc, link }, index) => (
              <Box key={index}>
                <Text fontSize={'14px'} fontWeight={'600'} marginBottom={'4px'}>
                  {account > 1 && <>{index + 1}. </>}
                  {title}
                </Text>
                <Text color={'readable.secondary'}>{desc}</Text>
                <Flex justifyContent={'right'}>
                  {link && (
                    <DCLink href={link} target="_blank" onClick={(e) => e.stopPropagation()}>
                      Learn More
                    </DCLink>
                  )}
                </Flex>
                {index !== discontinueReasons.length - 1 && <Divider my={12} />}
              </Box>
            ))}
          </Box>
        </MenuList>
      </>
    </Menu>
  );
};
