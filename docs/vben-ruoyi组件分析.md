toolName: view_files
            
status: success
          
            
filePath: /Users/xi/Documents/github/7-13/ruoyi-plus-vben5/apps/web-antd/src/views/system/client/client-drawer.vue
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/xi/Documents/github/7-13/ruoyi-plus-vben5/apps/web-antd/src/views/system/dept/dept-drawer.vue
          
这两个文件展示了 ruoyi-plus-vben5 项目中典型的"配置式"组件使用范式，主要特色如下：

## 1. 声明式组件 + Hook 函数式 API

不使用 `<Drawer>` / `<Form>` 这种纯组件，而是通过 `useVbenDrawer` / `useVbenForm` 返回一个**已绑定 api 的组件**：

```ts
const [BasicDrawer, drawerApi] = useVbenDrawer({ ... });
const [BasicForm, formApi] = useVbenForm({ ... });
```

组件实例与 api 句柄成对出现，模板里只渲染 `BasicDrawer` / `BasicForm`，逻辑层通过 `drawerApi` / `formApi` 控制。

## 2. 模板极简，几乎不写 HTML

[dept-drawer.vue#L175-179](file:///Users/xi/Documents/github/7-13/ruoyi-plus-vben5/apps/web-antd/src/views/system/dept/dept-drawer.vue#L175-L179) 整个 template 只有 4 行：

```vue
<template>
  <BasicDrawer :title="title" class="w-[600px]">
    <BasicForm />
  </BasicDrawer>
</template>
```

- 没有任何 `<div>`、`<span>`、`<a-form-item>` 等原生或样式包裹标签
- 表单字段、布局、校验、按钮全部在 `data.ts` 的 `drawerSchema()` 里以 JS 对象配置，模板里看不到任何字段
- 只有需要**插槽自定义渲染**时才展开（[client-drawer.vue#L130-134](file:///Users/xi/Documents/github/7-13/ruoyi-plus-vben5/apps/web-antd/src/views/system/client/client-drawer.vue#L130-L134) 的 `#clientSecret` 插槽）

## 3. 宽度用 Tailwind 工具类，不写 CSS

`class="w-[600px]"` 直接挂在组件上，不写 `style` 也不写 `:style`。

## 4. 样式只在"无法用配置表达"时才出现

[client-drawer.vue#L138-146](file:///Users/xi/Documents/github/7-13/ruoyi-plus-vben5/apps/web-antd/src/views/system/client/client-drawer.vue#L138-L146) 的 `<style scoped>` 只为自定义组件（SecretInput 内的 input）的校验失败态加样式，且明确注释了原因：

```scss
/** 自定义组件校验失败样式 */
:deep(.form-valid-error .ant-input[name='clientSecret']) { ... }
```

dept-drawer 干脆没有 `<style>` 段。

## 5. 通过 `updateSchema` 动态控制字段，而非 v-if/v-show

比如 [dept-drawer.vue#L88-98](file:///Users/xi/Documents/github/7-13/ruoyi-plus-vben5/apps/web-antd/src/views/system/dept/dept-drawer.vue#L88-L98) 中 `leader` 字段的 `disabled`、`options`、`placeholder` 全部通过 `formApi.updateSchema` 动态改，不在模板里写条件渲染：

```ts
formApi.updateSchema([{
  componentProps: { disabled: ret.length === 0, options, placeholder: ... },
  fieldName: 'leader',
}]);
```

## 6. 抽屉的标准生命周期骨架统一

两个文件都用同一套结构：`onBeforeClose` + `onConfirm` + `onClosed` + `onOpenChange`，配合 `useBeforeCloseDiff` 做"未保存改动"拦截，`drawerApi.lock(true/false)` 控制提交态，`emit('reload')` 通知父表刷新。这套约定让每个 drawer 文件结构高度一致。

## 7. 业务 API 与 schema 分离

`drawerSchema` 从 `./data` 导入，`clientAdd/Update/Info` 从 `#/api/...` 导入，组件文件本身只负责"装配"，不写数据结构和接口定义。

---

**总结**：核心特色就是 **"模板尽量空、配置尽量全"** —— 用 schema 驱动表单、用 api 驱动交互、用 Tailwind 类驱动样式，原生 HTML 和自定义 CSS 只在框架能力覆盖不到的地方出现。
