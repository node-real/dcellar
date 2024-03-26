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
import { Box, Divider, Flex, QDrawerBody, QDrawerHeader, Text } from '@node-real/uikit';
import { useMount, useUnmount } from 'ahooks';
import { last } from 'lodash-es';
import { memo, useMemo, useState } from 'react';
import { MOCK_EMPTY_FOLDER_OBJECT } from '@/modules/object/constant';
import { ObjectMeta } from '@bnb-chain/greenfield-js-sdk/dist/esm/types/sp/Common';
import { DCLink } from '@/components/common/DCLink';
import { Tips } from '@/components/common/Tips';
import { DCButton } from '@/components/common/DCButton';

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
    // const objectOperation = useAppSelector((root) => root.object.objectOperation);
    // const [id, operation, params] = objectOperation[1];
    // const preOperation = usePrevious(operation);
    // const preObjectName = usePrevious(params?.objectName);

    const cacheKey = [selectBucket.BucketName, objectName].join('/');
    const mockMeta: ObjectMeta = useMemo(
      () => ({
        ...MOCK_EMPTY_FOLDER_OBJECT,
        ObjectInfo: {
          ...MOCK_EMPTY_FOLDER_OBJECT.ObjectInfo,
          ObjectName: objectName,
          BucketName: selectBucket.BucketName,
        },
      }),
      [objectName, selectBucket.BucketName],
    );
    const selectObjectInfo = useModalValues(objectRecords[cacheKey] || mockMeta);
    const objectInfo = useModalValues(selectObjectInfo.ObjectInfo);
    const [folderExist, setFolderExist] = useState(true);
    const folderName = last(objectName.replace(/\/$/, '').split('/'));
    const loading = !(cacheKey in objectRecords) && folderExist;

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

    const getFolderObjectList = async () => {
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
      if (error || !res || res.code !== 0) return;
      const { GfSpListObjectsByBucketNameResponse } = res.body!;
      const list = GfSpListObjectsByBucketNameResponse!;
      // 更新文件夹objectInfo
      dispatch(setObjectList({ path: completeCommonPrefix, list, infoOnly: true }));
      return list;
    };

    // useAsyncEffect(async () => {
    //   if (preObjectName !== objectInfo.ObjectName || preOperation !== 'create_folder') return;
    //   await getFolderObjectList();
    // }, [preOperation, preObjectName, objectInfo.ObjectName]);

    useMount(async () => {
      const list = await getFolderObjectList();
      if (!list) return;
      // virtual path
      setFolderExist(list.Objects[0]?.ObjectInfo.ObjectName.endsWith('/') || false);
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
              <Text as={'div'} fontSize={14} fontWeight={500} color={'readable.tertiary'}>
                {folderExist ? (
                  '--'
                ) : (
                  <Flex alignItems={'center'}>
                    This is a folder simulated by a path.{' '}
                    <Tips
                      placement={'bottom'}
                      containerWidth={'220px'}
                      tips={
                        <Box fontSize={'12px'} lineHeight="14px" w={'200px'}>
                          <Box>
                            {
                              "This path doesn't exist as an entity on the blockchain and lacks chain information."
                            }
                          </Box>
                          <DCLink
                            href="https://docs.nodereal.io/docs/dcellar-faq#question-what-is--folder-simulated-by-a-path-"
                            target="_blank"
                          >
                            Learn more
                          </DCLink>
                        </Box>
                      }
                    />
                  </Flex>
                )}
              </Text>
            </Flex>
          </Flex>
          <Divider />
          <Flex position={'relative'} my={8} gap={8} flexDirection={'column'}>
            {!folderExist && (
              <Box
                position={'absolute'}
                w={310}
                h={'100%'}
                right={0}
                top={0}
                bg={'rgba(255, 255, 255, 0.70)'}
                backdropFilter={'blur(2px)'}
              >
                <DCButton
                  onClick={() =>
                    dispatch(
                      setObjectOperation({
                        operation: ['', 'create_folder', { objectName: objectInfo.ObjectName }],
                      }),
                    )
                  }
                  position={'absolute'}
                  right={24}
                  top={70}
                >
                  Create on chain folder
                </DCButton>
              </Box>
            )}
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
