import { useMemo, useState } from 'react';
import { ToolTypeEnum, toolList } from './config';

export type ToolTabKey = 'ALL' | 'DEV_TOOL' | 'SDK' | 'API';
export const useToolBoxTab = () => {
  const tabOptions = [
    {
      name: 'All Tools',
      key: 'ALL',
      data: toolList,
    },
    {
      name: 'Developer Tool',
      key: ToolTypeEnum.DevTool,
      data: toolList.filter((item) => item.type === ToolTypeEnum.DevTool),
    },
    {
      name: 'SDK',
      key: ToolTypeEnum.SDK,
      data: toolList.filter((item) => item.type === ToolTypeEnum.SDK),
    },
    {
      name: 'API',
      key: ToolTypeEnum.API,
      data: toolList.filter((item) => item.type === ToolTypeEnum.API),
    },
  ];

  const [activeKey, setActiveKey] = useState(tabOptions[0].key);

  return {
    tabOptions,
    activeKey,
    setActiveKey,
  };
};
