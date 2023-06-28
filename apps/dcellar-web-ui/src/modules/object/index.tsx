import React from 'react'

/**
 * 1. 进入object页面，需要获取到bucket的数据，应该直接从redux中获取 - 去除需要从API中获取bucket详情的操作
 * 2. 上传部分的设计，上传之前的检测放在drawer中，在drawer里面做hash和gas fee的计算；然后点击确认上传进度放在全局的模块中，这样可以在任何页面都可以看到上传的进度；
 * 3. 错误系统的封装，封装到facade里面去，进行报错，
 * 4. 路由保护，如果没有用户则跳转到登录页面，
 * 5. global保护，选择服务的sp并放在本地，没有则在选择一个sp放在本地中
 * 5. 进入第一条线，获取展示object list并展示，如果没有object则展示空页面
 * 6. 那么多的modal怎么处理，表单的类的放到drawer里面去，提示类的放在modal中，只会有状态modal了，放在一个里面还是多个里面呢？
 * 7. table的样式和翻页进行改变，这个比较简单，交互要改一下。上传完刷新页面回到第一页，且采用当前的排序方式。
 */


export const Object = () => {
  return (
    <div>index</div>
  )
}