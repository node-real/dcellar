import { Text, TextProps } from '@totejs/uikit'
import React from 'react'

interface EllipsisTextProps extends TextProps { }

export const EllipsisText = (props: EllipsisTextProps) => {
  return (
    <Text overflow={'hidden'} whiteSpace={'nowrap'} textOverflow={'ellipsis'} {...props}>{props.children}</Text>
  )
}
