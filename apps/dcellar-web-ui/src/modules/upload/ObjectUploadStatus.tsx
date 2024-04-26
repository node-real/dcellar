import { UploadObject } from '@/store/slices/global';
import { Text } from '@node-real/uikit';
import { Loading } from '@/components/common/Loading';
import { UploadProgress } from './UploadProgress';
import { IconFont } from '@/components/IconFont';

export const ObjectUploadStatus = ({ task }: { task: UploadObject }) => {
  switch (task.status) {
    case 'RETRY_CHECK':
    case 'RETRY_CHECKING':
      return (
        <>
          <Loading iconSize={12} justifyContent={'flex-end'} />
          Checking
        </>
      );
    case 'WAIT':
      return (
        <>
          <Loading iconSize={12} justifyContent={'flex-end'} />
          Waiting
        </>
      );
    case 'HASH':
      return (
        <>
          <Loading iconSize={12} justifyContent={'flex-end'} />
          Hashing
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
          Sealing
        </>
      );
    case 'FINISH':
      return (
        <>
          <IconFont type="colored-success" w={16} />
          Complete
        </>
      );
    case 'ERROR':
      return (
        <>
          <IconFont type="colored-error2" w={20} />
          Failed
        </>
      );
    case 'CANCEL':
      return (
        <>
          <IconFont type="colored-error2" w={20} />
          Cancelled
        </>
      );
    default:
      return null;
  }
};
