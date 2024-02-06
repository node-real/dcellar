import { GasFeeTips } from '@/modules/object/components/TotalFees/GasFeeTips'
import { renderFeeValue } from '@/modules/object/utils'
import { useAppSelector } from '@/store'
import { selectBnbPrice } from '@/store/slices/global'
import { Flex, Text } from '@totejs/uikit'
import React from 'react'

export const GasFee = ({amount}: {amount: string}) => {
  const bnbPrice = useAppSelector(selectBnbPrice);
  return (
    <Flex w="100%" alignItems="center" justifyContent="space-between">
    <Flex alignItems="center">
      <Text color="readable.tertiary" as="p">
        Gas fee
      </Text>
    </Flex>
    <Text color="readable.tertiary">{renderFeeValue(String(amount), bnbPrice)}</Text>
  </Flex>
  )
}