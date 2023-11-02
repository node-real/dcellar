import { AllBucketInfo } from '@/store/slices/bucket';
import { SpItem } from '@/store/slices/sp';
import React, { memo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { Divider, Flex, QDrawerBody, QDrawerHeader, Text } from '@totejs/uikit';
import { useMount } from 'ahooks';
import { IconFont } from '@/components/IconFont';
import { getListObjects } from '@/facade/object';
import { setObjectList } from '@/store/slices/object';
import { last } from 'lodash-es';
import { renderAddressLink, renderPropRow } from '@/modules/object/components/renderRows';
import { formatFullTime } from '@/utils/time';
import { formatId } from '@/utils/string';
import { useModalValues } from '@/hooks/useModalValues';

interface DetailFolderOperationProps {
  objectName: string;
  selectBucket: AllBucketInfo;
  primarySp: SpItem;
}

export const DetailFolderOperation = memo<DetailFolderOperationProps>(
  function DetailFolderOperation({ selectBucket, primarySp, objectName }) {
    const dispatch = useAppDispatch();
    const { path, objectsInfo } = useAppSelector((root) => root.object);
    const selectObjectInfo = useModalValues(
      objectsInfo[[selectBucket.BucketName, objectName].join('/')] || {},
    );
    const objectInfo = useModalValues(selectObjectInfo.ObjectInfo);

    useMount(async () => {
      const _query = new URLSearchParams();
      _query.append('delimiter', '/');
      _query.append('maxKeys', '2');
      _query.append('prefix', `${objectName}`);

      const params = {
        address: primarySp.operatorAddress,
        bucketName: selectBucket.BucketName,
        prefix: objectName,
        query: _query,
        endpoint: primarySp.endpoint,
        seedString: '',
      };

      const [res, error] = await getListObjects(params);
      // should never happen
      if (error || !res || res.code !== 0) return false;
      const { GfSpListObjectsByBucketNameResponse } = res.body!;
      // 更新文件夹objectInfo
      dispatch(
        setObjectList({ path, list: GfSpListObjectsByBucketNameResponse || [], infoOnly: true }),
      );
    });

    const folderName = last(objectName.replace(/\/$/, '').split('/'));
    const loading = !objectInfo;

    return (
      <>
        <QDrawerHeader>Folder Detail</QDrawerHeader>
        <QDrawerBody>
          <Flex mb={24}>
            <IconFont type="detail-folder" w={48} mr={24} />
            <Flex flex={1} flexDirection={'column'}>
              <Text
                fontSize={18}
                fontWeight={600}
                wordBreak={'break-all'}
                color={'readable.normal'}
                mb="8px"
                w={'100%'}
              >
                {folderName}
              </Text>
              <Text fontSize={14} fontWeight={500} color={'readable.tertiary'}>
                --
              </Text>
            </Flex>
          </Flex>
          <Divider />
          <Flex my={8} gap={8} flexDirection={'column'}>
            {renderPropRow(
              'Date created',
              loading ? '' : formatFullTime(+objectInfo.CreateAt * 1000),
            )}
            {renderAddressLink(
              'Object ID',
              loading ? '' : formatId(Number(objectInfo.Id)),
              'dc.file.f_detail_pop.id.click',
              'dc.file.f_detail_pop.copy_id.click',
              'object',
            )}
            {renderAddressLink(
              'Primary SP address',
              loading ? '' : primarySp.operatorAddress,
              'dc.file.f_detail_pop.spadd.click',
              'dc.file.f_detail_pop.copy_spadd.click',
            )}
            {renderAddressLink(
              'Payment address',
              loading ? '' : selectBucket.PaymentAddress,
              'dc.file.f_detail_pop.seal.click',
              'dc.file.f_detail_pop.copy_seal.click',
            )}
            {renderAddressLink(
              'Create transaction hash',
              loading ? '' : selectObjectInfo.CreateTxHash,
              'dc.object.f_detail_pop.CreateTxHash.click',
              'dc.object.f_detail_pop.copy_create_tx_hash.click',
              'tx',
            )}
          </Flex>
          <Divider />
        </QDrawerBody>
      </>
    );
  },
);