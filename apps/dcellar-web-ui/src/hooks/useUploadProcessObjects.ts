import { useAppSelector } from '@/store';
import { selectUploadQueue, UploadObject } from '@/store/slices/global';
import { useMemo } from 'react';

export const useUploadProcessObjects = (loginAccount: string) => {
  const queue = useAppSelector(selectUploadQueue(loginAccount));

  return useMemo(() => {
    const processUploadObjectRecord: Record<string, UploadObject> = {};
    const processUploadObjects = queue
      .filter((q) => q.status !== 'ERROR')
      .map((q) => {
        const key = [
          q.bucketName,
          ...q.prefixFolders,
          q.waitObject.relativePath || '',
          q.waitObject.name,
        ]
          .filter((item) => !!item)
          .join('/');
        processUploadObjectRecord[key] = q;
        return key;
      });

    return {
      processUploadObjects,
      processUploadObjectRecord,
    };
  }, [queue]);
};
