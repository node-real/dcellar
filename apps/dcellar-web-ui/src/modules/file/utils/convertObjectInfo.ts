import { isEmpty } from "lodash-es"
import { VisibilityToChain } from "./visibility"

export const convertObjectInfo = (objectInfo: any) => {
  if (isEmpty(objectInfo)) return {};
  const visibility = objectInfo.visibility as keyof typeof VisibilityToChain
  return {
    ...objectInfo,
    visibility: VisibilityToChain[visibility],
  }
}
