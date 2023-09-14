import { GAClick, GAShow } from '@/components/common/GATracker';
import MenuIcon from '@/public/images/icons/menu.svg';
import { Flex, Menu, MenuButton, MenuItem, MenuList, toast, Text } from '@totejs/uikit';
import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { getBucketReadQuota } from '@/facade/bucket';
import { getSpOffChainData } from '@/store/slices/persist';

export const ActionItem = ({ setShowDetail, setRowData, setQuotaData, onOpen, info }: any) => {
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { spInfo } = useAppSelector((root) => root.sp);
  const dispatch = useAppDispatch();
  // CellContext<any, unknown>
  const {
    row: { original: rowData },
  } = info;
  return (
    <Flex position="relative" gap={4} justifyContent="flex-end" alignItems={'center'}>
      <Menu offset={[-12, 0]} placement="bottom-start" trigger="hover" strategy="fixed">
        {({ isOpen }) => (
          <>
            <MenuButton
              // avoid the menu button to affect other layers
              position={'static'}
              boxSize={24}
              display={'flex'}
              justifyContent={'center'}
              alignItems={'center'}
              onClick={(e) => e.stopPropagation()}
              as={'div'}
              cursor="pointer"
              bgColor={isOpen ? 'rgba(0, 186, 52, 0.1)' : 'transparent'}
              color={isOpen ? 'readable.brand6' : 'readable.normal'}
              borderRadius={18}
              transitionProperty="colors"
              transitionDuration="normal"
              _hover={{
                bgColor: 'rgba(0, 186, 52, 0.2)',
                color: 'readable.brand6',
              }}
            >
              <MenuIcon />
            </MenuButton>
            <MenuList w={'120px'}>
              <GAShow name="dc.bucket.list_menu.0.show" isShow={isOpen} />
              <GAClick name="dc.bucket.list_menu.detail.click">
                <MenuItem
                  _hover={{
                    color: 'readable.brand7',
                    backgroundColor: 'rgba(0, 186, 52, 0.1)',
                  }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowDetail(true);
                    onOpen();
                    setRowData(rowData);
                    setQuotaData(null);
                    const sp = spInfo[rowData?.originalData.BucketInfo.PrimarySpAddress];
                    if (!sp) {
                      toast.error({
                        description: `Sp address info is mismatched, please retry.`,
                      });
                      return;
                    }
                    const { seedString } = await dispatch(
                      getSpOffChainData(loginAccount, sp.operatorAddress),
                    );
                    const currentQuotaData = await getBucketReadQuota({
                      bucketName: rowData.BucketName,
                      seedString,
                      address: loginAccount,
                      endpoint: sp.endpoint,
                    });
                    setQuotaData(currentQuotaData);
                  }}
                >
                  <Text fontWeight={500}>View Details</Text>
                </MenuItem>
              </GAClick>
              <GAClick name="dc.bucket.list_menu.delete.click">
                <MenuItem
                  _hover={{
                    color: 'readable.brand7',
                    backgroundColor: 'rgba(0, 186, 52, 0.1)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetail(false);
                    onOpen();
                    // TODO Do not mix information from rowData and sp
                    const curSp = spInfo[rowData.originalData.BucketInfo.PrimarySpAddress];
                    setRowData({ ...rowData, spEndpoint: curSp?.endpoint });
                  }}
                >
                  <Text fontWeight={500}>Delete</Text>
                </MenuItem>
              </GAClick>
            </MenuList>
          </>
        )}
      </Menu>
    </Flex>
  );
};
