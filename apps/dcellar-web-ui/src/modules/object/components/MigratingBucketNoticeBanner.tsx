import { Animates } from '@/components/AnimatePng';
import { IconFont } from '@/components/IconFont';
import { useAppDispatch, useAppSelector } from '@/store';
import { setSignatureAction } from '@/store/slices/global';
import { Flex, Text, toast } from '@node-real/uikit';
import { BUTTON_GOT_IT, WALLET_CONFIRM } from '../constant';
import { cancelMigrateBucket, headBucket } from '@/facade/bucket';
import { MsgCancelMigrateBucket } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/tx';
import { useAccount } from 'wagmi';
import { BucketStatus } from '@bnb-chain/greenfield-js-sdk';
import { setupBucket } from '@/store/slices/bucket';

export const MigratingBucketNoticeBanner = ({ bucketName }: { bucketName: string }) => {
  const dispatch = useAppDispatch();
  const { connector } = useAccount();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const onCancelMigration = async () => {
    dispatch(
      setSignatureAction({
        icon: Animates.object,
        title: 'Cancelling Migrate Bucket',
        desc: WALLET_CONFIRM,
      }),
    );
    const params: MsgCancelMigrateBucket = {
      operator: loginAccount,
      bucketName,
    };
    const bucketInfo = await headBucket(bucketName);
    if (bucketInfo?.bucketStatus === BucketStatus.BUCKET_STATUS_CREATED) {
      await dispatch(setupBucket(bucketName));
      dispatch(setSignatureAction({}));
      toast.success({ description: 'This bucket has been migrated!' });
      return;
    }

    const [txRes, error] = await cancelMigrateBucket(params, connector!);

    if (!txRes || txRes.code !== 0) {
      return dispatch(
        setSignatureAction({
          title: 'Migrate Failed',
          icon: 'status-failed',
          desc: 'Sorry, there’s something wrong when signing with the wallet.',
          buttonText: BUTTON_GOT_IT,
          errorText: 'Error message: ' + error,
        }),
      );
    }
    await dispatch(setupBucket(bucketName));
    dispatch(setSignatureAction({}));
    toast.success({ description: 'Cancel Migrate Bucket successfully!' });
  };

  return (
    <Flex
      color={'#1184EE'}
      justifyContent={'space-between'}
      mb={16}
      backgroundColor="opacity7"
      padding={8}
      alignItems={'center'}
    >
      <Flex alignItems={'center'} gap={4}>
        <IconFont type="migrate" />
        This bucket, in the process of data migration to another provider, supports only downloads,
        quota modifications, deletions, and sharing.
      </Flex>
      <Text
        as="span"
        _hover={{ color: '#1184EE' }}
        cursor="pointer"
        textDecoration={'underline'}
        onClick={onCancelMigration}
      >
        Cancel Migration
      </Text>
    </Flex>
  );
};
