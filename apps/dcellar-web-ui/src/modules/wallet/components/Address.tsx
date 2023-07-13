import {
  Box,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
} from '@totejs/uikit';
import React, { useMemo } from 'react';
import { useNetwork } from 'wagmi';
import { isEmpty } from 'lodash-es';
import { FieldErrors, UseFormGetValues, UseFormRegister } from 'react-hook-form';

import { isRightChain } from '../utils/isRightChain';
import { POPPINS_FONT, WalletOperationInfos } from '../constants';
import { TWalletFromValues } from '../type';
import { Tips } from '@/components/common/Tips';
import { useAppSelector } from '@/store';

type AddressProps = {
  disabled: boolean;
  errors: FieldErrors;
  register: UseFormRegister<TWalletFromValues>;
  getValues: UseFormGetValues<TWalletFromValues>;
  gaShowTipsName?: string;
};

export const Address = ({ disabled, errors, register, gaShowTipsName }: AddressProps) => {
  const { transType } = useAppSelector((root) => root.wallet);
  const curInfo = WalletOperationInfos[transType];
  const { chain } = useNetwork();
  const isRight = useMemo(() => {
    return isRightChain(chain?.id, curInfo?.chainId);
  }, [chain?.id, curInfo?.chainId]);

  return (
    <Box mb={'12px'}>
      <FormControl isInvalid={!isEmpty(errors?.address)}>
        <FormLabel
          marginBottom={'8px'}
          fontWeight={500}
          fontSize="14px"
          lineHeight="150%"
          htmlFor="text"
          display={'inline-block'}
          fontFamily={POPPINS_FONT}
        >
          Address
        </FormLabel>
        <InputGroup>
          <Input
            id="address"
            border="1px solid #EAECF0"
            disabled={!isRight || disabled}
            placeholder="Enter BNB Greenfield address"
            fontSize="14px"
            fontWeight={500}
            height="52px"
            {...register('address', {
              required: 'Address is required',
              pattern: {
                value: /^0x[a-fA-F0-9]{40}$/,
                message: 'Please input a correct BNB Greenfield account address.',
              },
            })}
          />
          <InputRightElement paddingRight={'16px'}>
            <Tips
              iconSize={'24px'}
              containerWidth="308px"
              tips={
                <Box minW={'240px'}>
                  Only send to BNB Greenfield addresses. Sending to other network addresses may
                  result in permanent loss.
                </Box>
              }
              gaShowName={gaShowTipsName}
            ></Tips>
          </InputRightElement>
        </InputGroup>
        {/* @ts-ignore */}
        <FormErrorMessage textAlign={'right'}>{[errors?.address?.message]}</FormErrorMessage>
      </FormControl>
    </Box>
  );
};
