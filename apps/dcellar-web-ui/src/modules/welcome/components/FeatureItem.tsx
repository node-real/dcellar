import { Flex, Text, Image } from '@totejs/uikit';
import { TFeatureItem } from './KeyFeatures';
import { smMedia } from '@/modules/responsive';
import { INTER_FONT } from '@/modules/wallet/constants';

export const FeatureItem = ({ title, desc, tag, introImg }: TFeatureItem) => {
  return (
    <Flex
      borderRadius={'4px'}
      bg={'bg.secondary'}
      padding={'24px 0 0 24px'}
      sx={{
        [smMedia]: {
          flexDirection: 'column',
          padding: 0,
        },
      }}
    >
      <Flex
        gap={16}
        w={'50%'}
        flexDirection={'column'}
        justifyContent={'center'}
        sx={{
          [smMedia]: {
            w: '100%',
            padding: '16px 16px 0 16px',
          },
        }}
      >
        <Text
          as="h3"
          fontSize={24}
          fontWeight={700}
          fontFamily={INTER_FONT}
          sx={{
            [smMedia]: {
              fontSize: 16,
            },
          }}
        >
          {title}
        </Text>
        {tag && (
          <Text
            fontSize={16}
            fontWeight={500}
            fontFamily={INTER_FONT}
            sx={{
              [smMedia]: {
                fontSize: 14,
              },
            }}
          >
            {tag}
          </Text>
        )}
        <Text
          fontFamily={INTER_FONT}
          sx={{
            fontWeight: 400,
          }}
        >
          {desc}
        </Text>
      </Flex>
      <Image
        alt={`${title} image`}
        w={'50%'}
        src={introImg}
        sx={{
          [smMedia]: {
            w: '100%',
            marginTop: 24,
          },
        }}
      />
    </Flex>
  );
};

export default FeatureItem;
