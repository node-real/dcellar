import { Tips } from '@/components/common/Tips';
import {
  renderBalanceNumber,
  renderFeeValue,
  renderInsufficientBalance,
  renderPrelockedFeeValue,
} from '@/modules/file/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import { MsgCreateObjectTypeUrl } from '@bnb-chain/greenfield-chain-sdk';
import { Box, Flex, Link, Text } from '@totejs/uikit';
import React from 'react';
import { useMount } from 'ahooks';
import { setupTmpAvailableBalance } from '@/store/slices/global';

interface FeeProps {
  lockFee: string;
}

export const Fee = ({ lockFee }: FeeProps) => {
  const dispatch = useAppDispatch();
  const { loginAccount } = useAppSelector((root) => root.persist);
  const { _availableBalance: availableBalance } = useAppSelector((root) => root.global);
  const { gasList = {} } = useAppSelector((root) => root.global.gasHub);
  const { gasFee } = gasList?.[MsgCreateObjectTypeUrl] || {};
  const { price: exchangeRate } = useAppSelector((root) => root.global.bnb);

  useMount(() => {
    dispatch(setupTmpAvailableBalance(loginAccount));
  });

  const renderFee = (
    key: string,
    bnbValue: string,
    exchangeRate: number,
    keyIcon?: React.ReactNode,
  ) => {
    return (
      <Flex w="100%" alignItems={'center'} justifyContent={'space-between'}>
        <Flex alignItems="center" mb="4px">
          <Text
            fontSize={'14px'}
            lineHeight={'28px'}
            fontWeight={400}
            color={'readable.tertiary'}
            as="p"
          >
            {key}
          </Text>
          {keyIcon && (
            <Box ml="6px" mt={'-1px'}>
              {keyIcon}
            </Box>
          )}
        </Flex>
        <Text fontSize={'14px'} lineHeight={'28px'} fontWeight={400} color={'readable.tertiary'}>
          {key === 'Pre-locked storage fee'
            ? renderPrelockedFeeValue(bnbValue, exchangeRate)
            : renderFeeValue(bnbValue, exchangeRate)}
        </Text>
      </Flex>
    );
  };

  return (
    <>
      <Flex
        w="100%"
        padding={'16px'}
        bg={'bg.secondary'}
        flexDirection={'column'}
        borderRadius="12px"
        gap={'4px'}
      >
        {renderFee(
          'Pre-locked storage fee',
          lockFee,
          +exchangeRate,
          <Tips
            iconSize={'14px'}
            containerWidth={'308px'}
            tips={
              <Box width={'308px'} p="0px 7px">
                <Box
                  color={'readable.normal'}
                  fontSize="14px"
                  lineHeight="1.5"
                  wordBreak={'break-word'}
                >
                  <Box as="p">
                    To upload and store objects on Greenfield, in addition to the transaction fee, a
                    certain amount of BNB will be pre-locked for 6 months of storage. The storage
                    fee will be charged based on the flow rate.{' '}
                    <Link
                      href="https://docs.nodereal.io/docs/dcellar-faq#fee-related"
                      target="_blank"
                      color="readable.primary"
                      textDecoration="underline"
                      _hover={{ color: 'readable.brand5' }}
                    >
                      Learn more
                    </Link>
                  </Box>
                </Box>
              </Box>
            }
          />,
        )}
        {renderFee('Gas fee', gasFee + '', +exchangeRate)}
      </Flex>
      <Flex w={'100%'} justifyContent={'space-between'} mt="8px">
        {/*todo correct the error showing logics*/}
        <Text fontSize={'12px'} lineHeight={'16px'} color={'scene.danger.normal'}>
          {renderInsufficientBalance(gasFee + '', lockFee, availableBalance || '0', {
            gaShowName: 'dc.file.upload_modal.transferin.show',
            gaClickName: 'dc.file.upload_modal.transferin.click',
          })}
        </Text>
        <Text fontSize={'12px'} lineHeight={'16px'} color={'readable.disabled'}>
          Available balance: {renderBalanceNumber(availableBalance || '0')}
        </Text>
      </Flex>
    </>
  );
};

export default Fee;
