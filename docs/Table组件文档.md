让我检查一下最终的实现状态，以便编写准确的文档。
        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/xi/Documents/github/7-13/vue-vben-admin/apps/web-ele/src/views/leave/workflow/index.vue
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/xi/Documents/github/7-13/vue-vben-admin/apps/web-ele/src/views/leave/workflow/index.vue
          

        
            
toolName: view_files
            
status: success
          
            
filePath: /Users/xi/Documents/github/7-13/vue-vben-admin/apps/web-ele/src/views/leave/workflow/index.vue
          
下面是完整的步骤文档：

---

# 在 web-ele 中使用 BasicTable（vxe-table 封装）的步骤

## 一、前置：修复 @vxe-ui/core 版本冲突

vxe-table 的工具栏按钮（齿轮/全屏/刷新）依赖 `VxeButton` 组件。如果项目中存在两个 `@vxe-ui/core` 版本，`init.ts` 注册的 `VxeButton` 和工具栏查找的不是同一个 `VxeUI` 实例，按钮就不会渲染。

**文件**: `pnpm-workspace.yaml`

```yaml
overrides:
  '@vxe-ui/core': 4.4.14   # 强制统一为单一版本
```

修改后执行 `pnpm install`，确认 `.pnpm/` 目录下只剩一个 `@vxe-ui+core@4.4.14`。

---

## 二、导入必要模块

**文件**: `apps/web-ele/src/views/leave/workflow/index.vue`

```ts
// 1. 类型导入
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { LeaveWorkflowApi } from '#/api';

// 2. 组件导入
import { Page } from '@vben/common-ui';               // ← 必须显式导入，否则报 reqComp
import { ElTag } from 'element-plus';                  // ← 表格内用 ElTag 渲染标签
import { useVbenVxeGrid } from '#/adapter/vxe-table';  // ← 核心 hook
```

| 导入项 | 作用 |
|--------|------|
| `VxeGridProps` | 定义 gridOptions 的泛型类型 |
| `useVbenVxeGrid` | 返回 `[BasicTable 组件, tableApi 实例]` |
| `Page` | 页面外壳组件（不导入会 console 报错） |
| `ElTag` | 在列插槽中渲染审批人标签、状态标签 |

---

## 三、定义 gridOptions

```ts
const gridOptions: VxeGridProps<LeaveWorkflowApi.LeaveWorkflow> = {
  id: 'leave-workflow-index',       // 唯一标识，用于列设置持久化
  rowConfig: { keyField: 'id' },    // 行主键

  // ── 列定义 ──
  columns: [
    { field: 'name', title: '名称', minWidth: 180, slots: { default: 'name' } },
    { field: 'priority', title: '优先级', width: 90 },           // 纯文本列，无需 slot
    { title: '匹配条件', minWidth: 220, slots: { default: 'match' } },
    { title: '审批链', minWidth: 260, slots: { default: 'approvers' } },
    { field: 'is_active', title: '状态', width: 90, slots: { default: 'status' } },
    { title: '操作', width: 180, fixed: 'right', slots: { default: 'action' } },
  ],

  // ── 数据加载方式 ──
  proxyConfig: { enabled: false },  // 关闭代理，改为手动 setGridOptions

  // ── 工具栏配置（右上角三个按钮）──
  toolbarConfig: {
    zoom: true,                     // 全屏按钮（内置，依赖 VxeButton）
    custom: true,                   // 齿轮按钮 = 自定义列显隐（内置）
    tools: [                        // 自定义工具按钮
      { code: 'manual-refresh', icon: 'vxe-icon-refresh', circle: true, name: '刷新' },
    ],
  },

  customConfig: { storage: false }, // 齿轮弹窗的列设置不持久化到 localStorage
};
```

### 列定义规则

| 写法 | 渲染方式 | 使用场景 |
|------|---------|---------|
| `{ field: 'priority', title: '优先级' }` | 直接显示字段值 | 纯文本数据 |
| `{ slots: { default: 'name' } }` | 用 `<template #name="{ row }">` 自定义渲染 | 需要组件/格式化/条件渲染 |

### toolbarConfig 三个按钮的对应关系

| 配置项 | HTML 中的按钮 | 图标 class | 功能 |
|--------|-------------|------------|------|
| `custom: true` | `title="Custom setting"` | `vxe-icon-setting` | 打开列显隐/排序弹窗 |
| `zoom: true` | `title="Full screen"` | `vxe-icon-fullscreen` | 表格全屏切换 |
| `tools: [{ code: 'manual-refresh', ... }]` | 自定义 | `vxe-icon-refresh` | 手动触发刷新 |

> 内置 `refresh: true` 依赖 `proxyConfig` 代理才能工作。本项目用 `proxyConfig: { enabled: false }` + 手动加载，所以用 `tools` 自定义刷新按钮。

---

## 四、创建 BasicTable 实例

```ts
const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions,
  gridEvents: {
    toolbarToolClick(event: { code: string }) {
      if (event.code === 'manual-refresh') {
        fetchWorkflows();   // 点击自定义刷新按钮时重新加载数据
      }
    },
  },
});
```

| 返回值 | 类型 | 用途 |
|--------|------|------|
| `BasicTable` | Vue 组件 | 在 `<template>` 中直接使用 `<BasicTable>` |
| `tableApi` | API 实例 | 调用 `setGridOptions()`、`query()` 等方法操作表格 |

---

## 五、数据加载方法

```ts
async function fetchWorkflows() {
  loading.value = true;
  try {
    workflows.value = await getLeaveWorkflowsApi();
    tableApi.setGridOptions({ data: workflows.value });  // ← 关键：手动设置表格数据
  } catch {
    workflows.value = [];
    tableApi.setGridOptions({ data: [] });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  startLiveClock();
  Promise.all([fetchWorkflows(), fetchEmployees(), loadSystemSettings()]);
});
```

> `proxyConfig: { enabled: false }` 时，表格不会自动加载。必须在 `onMounted` 中手动调用 `fetchWorkflows()`，并通过 `tableApi.setGridOptions({ data })` 注入数据。

---

## 六、模板：用 BasicTable 替换手写表格

### 替换前（手写 table）

```html
<ElCard class="card list-panel">
  <template #header><h3>流程列表</h3></template>
  <div>共 {{ workflows.length }} 条流程</div>
  <thead><tr><th>名称</th>...</tr></thead>
  <tbody>
    <tr v-for="workflow in workflows" :key="workflow.id">...</tr>
  </tbody>
</ElCard>
```

### 替换后（BasicTable + 插槽）

```html
<BasicTable :table-title="`流程列表（共 ${workflows.length} 条）`">
  <!-- 名称列：加粗 -->
  <template #name="{ row }">
    <strong>{{ row.name }}</strong>
  </template>

  <!-- 匹配条件列：调用格式化函数 -->
  <template #match="{ row }">
    {{ buildMatchText(row.match) }}
  </template>

  <!-- 审批链列：用 ElTag 渲染每个审批人 -->
  <template #approvers="{ row }">
    <ElTag
      v-for="(item, index) in row.approvers"
      :key="index"
      size="small"
      type="info"
      style="margin-right: 4px"
    >
      {{ index + 1 }}级：{{ item.username }}
    </ElTag>
    <span v-if="!row.approvers.length">-</span>
  </template>

  <!-- 状态列：ElTag 根据条件变色 -->
  <template #status="{ row }">
    <ElTag :type="row.is_active ? 'success' : 'danger'" size="small">
      {{ row.is_active ? '启用' : '禁用' }}
    </ElTag>
  </template>

  <!-- 操作列：link 风格按钮 -->
  <template #action="{ row }">
    <ElButton size="small" link type="primary" @click="startEdit(row)">编辑</ElButton>
    <ElButton size="small" link type="primary" @click="toggleWorkflowStatus(row)">
      {{ row.is_active ? '禁用' : '启用' }}
    </ElButton>
    <ElButton size="small" link type="danger" @click="deleteWorkflow(row)">删除</ElButton>
  </template>
</BasicTable>
```

### 插槽名与列定义的对应关系

`gridOptions.columns` 中 `slots: { default: 'xxx' }` 定义插槽名，模板中用 `<template #xxx="{ row }">` 接收行数据：

```
columns: [{ slots: { default: 'name' } }]  ←→  <template #name="{ row }">
columns: [{ slots: { default: 'match' } }] ←→  <template #match="{ row }">
columns: [{ slots: { default: 'action' } }]←→  <template #action="{ row }">
```

---

## 七、样式说明

### 表格内部样式（无需自己写 CSS）

| 元素 | 样式来源 | 说明 |
|------|---------|------|
| 工具栏容器 `.vxe-tools--operate` | `packages/effects/plugins/src/vxe-table/style.css` | 按钮间距 `margin-left: 8px` |
| 表格圆角、边框 | `apps/web-ele/src/adapter/vxe-table.ts` 全局 `setConfig` | `round: true`, `border: false`, `size: 'small'` |
| 按钮排列 | vxe-table 内置 | 工具栏右侧自动排列 |

### 插槽内的组件样式

| 组件 | 样式写法 | 效果 |
|------|---------|------|
| `ElTag` | `size="small"` + `type="info/success/danger"` | 小号彩色标签 |
| `ElTag` 间距 | `style="margin-right: 4px"` | 审批链标签之间留 4px 间距 |
| `ElButton` | `size="small"` + `link` + `type="primary/danger"` | 链接风格的行内操作按钮 |

---

## 八、完整步骤总结

```
1. pnpm-workspace.yaml 添加 @vxe-ui/core override → pnpm install
2. 导入 useVbenVxeGrid + VxeGridProps + Page + ElTag
3. 定义 gridOptions（columns + proxyConfig: false + toolbarConfig）
4. const [BasicTable, tableApi] = useVbenVxeGrid({ gridOptions, gridEvents })
5. fetchWorkflows 中用 tableApi.setGridOptions({ data }) 注入数据
6. onMounted 调用 fetchWorkflows
7. 模板中 <BasicTable :table-title="..."> + 各列 <template #slotName="{ row }">
```
