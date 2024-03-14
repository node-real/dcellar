import { IconFont } from '@/components/IconFont';
import { DEFAULT_TAG } from '@/components/common/ManageTags';
import { getListObjects } from '@/facade/object';
import { useModalValues } from '@/hooks/useModalValues';
import { SharePermission } from '@/modules/object/components/SharePermission';
import {
  renderAddressLink,
  renderPropRow,
  renderTags,
} from '@/modules/object/components/renderRows';
import { useAppDispatch, useAppSelector } from '@/store';
import { TBucket } from '@/store/slices/bucket';
import { setObjectEditTagsData, setObjectList, setObjectOperation } from '@/store/slices/object';
import { SpEntity } from '@/store/slices/sp';
import { convertObjectKey } from '@/utils/common';
import { formatId } from '@/utils/string';
import { formatFullTime } from '@/utils/time';
import { ResourceTags_Tag } from '@bnb-chain/greenfield-cosmos-types/greenfield/storage/types';
import { Divider, Flex, QDrawerBody, QDrawerHeader, Text } from '@node-real/uikit';
import { useMount, useUnmount } from 'ahooks';
import { last } from 'lodash-es';
import { memo } from 'react';

interface DetailFolderOperationProps {
  objectName: string;
  selectBucket: TBucket;
  primarySp: SpEntity;
}

export const DetailFolderOperation = memo<DetailFolderOperationProps>(
  function DetailFolderOperation({ selectBucket, primarySp, objectName }) {
    const dispatch = useAppDispatch();
    const completeCommonPrefix = useAppSelector((root) => root.object.completeCommonPrefix);
    const objectRecords = useAppSelector((root) => root.object.objectRecords);

    const selectObjectInfo = useModalValues(
      objectRecords[[selectBucket.BucketName, objectName].join('/')] || {},
    );
    const objectInfo = useModalValues(selectObjectInfo.ObjectInfo);
    const folderName = last(objectName.replace(/\/$/, '').split('/'));
    const loading = !objectInfo;

    const onEditTags = () => {
      const lowerKeyTags = selectObjectInfo.ObjectInfo?.Tags?.Tags.map((item) =>
        convertObjectKey(item, 'lowercase'),
      );
      dispatch(setObjectEditTagsData(lowerKeyTags as ResourceTags_Tag[]));
      dispatch(
        setObjectOperation({
          level: 1,
          operation: [`${objectInfo.BucketName}/${objectInfo.ObjectName}`, 'update_tags'],
        }),
      );
    };

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
        setObjectList({
          path: completeCommonPrefix,
          list: GfSpListObjectsByBucketNameResponse || [],
          infoOnly: true,
        }),
      );
    });

    useUnmount(() => dispatch(setObjectEditTagsData([DEFAULT_TAG])));

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
            {renderTags({
              onClick: onEditTags,
              tagsCount: selectObjectInfo.ObjectInfo?.Tags.Tags.length || 0,
            })}
          </Flex>
          <Divider />
          {!loading && <SharePermission selectObjectInfo={selectObjectInfo} />}
        </QDrawerBody>
      </>
    );
  },
);
