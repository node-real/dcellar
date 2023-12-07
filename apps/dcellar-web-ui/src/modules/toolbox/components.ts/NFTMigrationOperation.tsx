import {
  Box,
  FormControl,
  FormLabel,
  Input,
  QDrawerBody,
  QDrawerFooter,
  QDrawerHeader,
  Text,
  toast,
} from '@totejs/uikit';
import { NFTNetworkSelector } from './NFTNetworkSelector';
import { useRef } from 'react';
import { DCButton } from '@/components/common/DCButton';
import { useContract } from '../lib/useContract';
import { MigrationTable } from './MigrationTable';
import { useAppDispatch, useAppSelector } from '@/store';
import { setupNftData, setNftAddress, setToolboxOperation } from '@/store/slices/toolbox';
import { getTimestamp } from '@/utils/time';
import {
  UploadFile,
  addNftToUploadQueue,
  setTaskManagement,
  setTmpAccount,
} from '@/store/slices/global';
import { createTmpAccount } from '@/facade/account';
import { parseEther } from 'ethers/lib/utils.js';
import { useAccount } from 'wagmi';
import { useAsyncEffect } from 'ahooks';
import { setupBuckets } from '@/store/slices/bucket';
import { selectBucketList } from '@/store/slices/bucket';
import { SpItem } from '@/store/slices/sp';

export const NFTMigrationOperation = () => {
  const { allSps } = useAppSelector((root) => root.sp);
  const { connector } = useAccount();
  const dispatch = useAppDispatch();
  const loginAccount = useAppSelector((root) => root.persist.loginAccount);
  const bucketList = useAppSelector(selectBucketList(loginAccount));
  const selectedNetworkRef = useRef<any>({});
  const { nftAddress } = useAppSelector((root) => root.toolbox);
  console.log('bucketList', bucketList);
  const onContractChange = (event: any) => {
    console.log('onContractChange', event);
    dispatch(setNftAddress(event.target.value));
  };
  // 上传前需要获取到bucket的所有信息
  useAsyncEffect(async () => {
    if (!loginAccount) return;
    dispatch(setupBuckets(loginAccount));
  }, [loginAccount, dispatch]);
  const onNetworkChange = (item: any) => {
    console.log('onNetworkChange', item);
    selectedNetworkRef.current = item;
  };

  const { erc165, erc721Enumerable } = useContract({ chainId: 97, address: nftAddress });
  console.log('nftAddress', nftAddress, erc165, erc721Enumerable);
  const onNextStep = async () => {
    const [data, error] = await dispatch(
      setupNftData({
        erc165,
        erc721Enumerable,
        nftAddress,
      }),
    );
    if (data === null || error) {
      return toast.error({ description: error as string });
    }
    const bucket = bucketList[0];
    const sp = allSps.find((item) => +item.id === +bucket.Vgf.PrimarySpId) as SpItem;
    const uploadFiles = data.map((item) => {
      const time = getTimestamp();
      const id = parseInt(String(time + time * Math.random()));
      const uploadFile: UploadFile = {
        bucketName: 'nft-migration',
        prefixFolders: [],
        id,
        spAddress: sp.operatorAddress,
        waitFile: {
          httpUrl: item.httpImage,
          file: new File([], ''),
          name: item.tokenId + '-' + id,
          status: 'CHECK',
          id,
          time: time,
          msg: '',
          type: '',
          size: 0,
          relativePath: '',
        },
        checksum: [],
        status: 'WAIT-FETCH',
        visibility: 1,
        createHash: '',
        msg: '',
        progress: 0,
      };

      return uploadFile;
    });
    const safeAmount = 0.1;
    const [tmpAccount, cError] = await createTmpAccount({
      address: loginAccount,
      bucketName: 'nft-migration',
      amount: parseEther(String(safeAmount)).toString(),
      connector,
    });
    if (tmpAccount === null || cError) {
      return toast.error({
        description: 'create tmp account error',
      });
    }
    dispatch(setTmpAccount(tmpAccount));
    dispatch(addNftToUploadQueue({ account: loginAccount, tasks: uploadFiles }));
    dispatch(setToolboxOperation(''));
    dispatch(setTaskManagement(true));
  };

  return (
    <>
      <QDrawerHeader flexDirection={'column'}>
        <Box>NFT Migration</Box>
        <Text fontSize={16} fontWeight={400} color="readable.tertiary" mt={4}>
          This is a long long long long long long long long long long long long long description.
        </Text>
      </QDrawerHeader>
      <QDrawerBody>
        <FormControl mb={24}>
          <FormLabel fontSize={14} fontWeight={500} mb={8}>
            Primary Storage Provider
          </FormLabel>
          <NFTNetworkSelector onChange={onNetworkChange} />
        </FormControl>
        <FormControl mb={24}>
          <FormLabel fontWeight={500} fontSize={14} mb={8}>
            NFT Contract
          </FormLabel>
          <Input
            autoFocus
            autoComplete="off"
            type="text"
            id="bucketName"
            border="1px solid readable.border"
            placeholder="Enter NFT Contract to get the information"
            fontSize="16px"
            lineHeight={'19px'}
            fontWeight={500}
            height="52px"
            onChange={onContractChange}
          />
        </FormControl>
        {/* <FormControl>
          <FormLabel fontSize={14} fontWeight={500} mb={8}>
            Select Destination
          </FormLabel>
          <DestinationSelector onChange={() => { }} />
        </FormControl> */}
        <MigrationTable />
      </QDrawerBody>
      <QDrawerFooter>
        <DCButton onClick={() => onNextStep()}>Next Step</DCButton>
      </QDrawerFooter>
    </>
  );
};
