import { Card } from './Common';
import { Box, Flex, Link, Text } from '@node-real/uikit';
import { IconFont } from '@/components/IconFont';
import { DCButton } from '@/components/common/DCButton';
import { useRouter } from 'next/router';
import { InternalRoutePaths } from '@/constants/paths';
import { useAppDispatch } from '@/store';
import { setIsShowTutorialCard } from '@/store/slices/persist';

export const TutorialCard = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const onHideClick = () => {
    dispatch(setIsShowTutorialCard(false));
  };

  const steps = [
    {
      title: 'Create a bucket',
      description:
        "A bucket acts as your data's storage space. Feel free to manage your data via the console or the SDK.",
      icon: 'create-bucket',
      Link: (
        <DCButton onClick={() => router.push(InternalRoutePaths.buckets)}>Create Bucket</DCButton>
      ),
    },
    {
      title: 'Manage Objects',
      description:
        'Upload, delete, and share objects with invited groups that have the appropriate authority levels.',
      icon: 'upload-objects',
      Link: (
        <Link
          fontWeight={500}
          target="_blank"
          href="https://docs.nodereal.io/docs/dcellar-get-started#upload-object"
        >
          Learn More
        </Link>
      ),
    },
    {
      title: 'Monitor Usage',
      description:
        'DCellar provides a highly efficient dashboard, enabling you to manage your data usage and cost estimates with ease.',
      icon: 'share-objects',
      Link: (
        <Link
          fontWeight={500}
          target="_blank"
          href="https://docs.nodereal.io/docs/dcellar-get-started#monitor-usage"
        >
          Learn More
        </Link>
      ),
    },
  ];

  return (
    <Card mb={16} border="1px solid brand.brand6">
      <Flex justifyContent={'space-between'} paddingY={8} mb={8}>
        <Text fontSize={18} fontWeight={700}>
          Get Started with BNB Greenfield
        </Text>
        <Flex
          onClick={onHideClick}
          gap={4}
          color={'readable.tertiary'}
          alignItems={'center'}
          cursor={'pointer'}
        >
          <IconFont type="nosee" />
          <Text>Don&apos;t show again</Text>
        </Flex>
      </Flex>
      <Flex>
        {steps.map((step, index) => (
          <>
            <Box key={index} marginX={24}>
              <Flex gap={8} mb={8} alignItems={'center'}>
                <Flex
                  fontSize={12}
                  w={20}
                  h={20}
                  justifyContent={'center'}
                  alignItems={'center'}
                  color={'brand.brand6'}
                  border="1px solid brand.brand6"
                  borderRadius={'10'}
                >
                  {index + 1}
                </Flex>
                <Text fontWeight={600}>{step.title}</Text>
              </Flex>
              <Text color="readable.tertiary" mb={16}>
                {step.description}
              </Text>
              {step.Link}
            </Box>
            {index !== steps.length - 1 && <Box w={1} bg={'readable.border'} />}
          </>
        ))}
      </Flex>
    </Card>
  );
};
