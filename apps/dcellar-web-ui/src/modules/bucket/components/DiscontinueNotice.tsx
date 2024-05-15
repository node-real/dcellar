import { IconFont } from '@/components/IconFont';
import { DCLink } from '@/components/common/DCLink';
import { Box, Divider, Flex, Menu, MenuButton, MenuList, Text } from '@node-real/uikit';

export const DiscontinueNotice = ({
  content,
  learnMore,
  flowRateLimit = false,
  discontinue = true,
}: {
  content: string;
  learnMore: string;
  flowRateLimit?: boolean;
  discontinue?: boolean;
}) => {
  const account = discontinue && flowRateLimit ? 2 : 0;
  // todo
  const discontinueReasons = [
    {
      title: 'Flow rate exceeds limit',
      desc: "This bucket's flow rate has surpassed the payment account's...",
      link: 'https://docs.nodereal.io/docs/dcellar-faq#question-what-is-flow-rate',
      show: flowRateLimit,
    },
    { title: 'Discontinue Notice', desc: content, link: learnMore, show: discontinue },
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
          <IconFont type="colored-error2" w={16} />
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
                  <DCLink href={link} target="_blank" onClick={(e) => e.stopPropagation()}>
                    Learn More
                  </DCLink>
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
