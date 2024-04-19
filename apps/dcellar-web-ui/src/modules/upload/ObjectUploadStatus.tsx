import { UploadObject } from '@/store/slices/global';
import { Flex, Text } from '@node-real/uikit';
import { Loading } from '@/components/common/Loading';
import { UploadProgress } from './UploadProgress';
import { IconFont } from '@/components/IconFont';

export const ObjectUploadStatus = ({ task }: { task: UploadObject }) => {
  switch (task.status) {
    case 'WAIT':
      return (
        <>
          <Loading iconSize={12} justifyContent={'flex-end'} />
          <Text marginLeft={'4px'} fontWeight={400}>
            Waiting
          </Text>
        </>
      );
    case 'HASH':
      return (
        <>
          <Loading iconSize={12} justifyContent={'flex-end'} />
          <Text marginLeft={'4px'} fontWeight={400}>
            Hashing
          </Text>
        </>
      );
    case 'HASHED':
      return <UploadProgress value={0} />;
    case 'SIGN':
      return <UploadProgress value={0} />;
    case 'SIGNED':
      return <UploadProgress value={0} />;
    case 'UPLOAD':
      return <UploadProgress value={task.progress || 0} />;
    case 'SEAL':
    case 'SEALING':
      return (
        <>
          <Loading iconSize={12} justifyContent={'flex-end'} />
          <Text marginLeft={'4px'} fontWeight={400}>
            Sealing
          </Text>
        </>
      );
    case 'FINISH':
      return <IconFont type="colored-success" w={16} mr={8} />;
    case 'ERROR':
      return <IconFont type="colored-error2" w={20} mr={6} />;
    case 'CANCEL':
      return <IconFont type="colored-error2" w={20} mr={6} />;
    default:
      return null;
  }
};
