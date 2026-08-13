# 报销页面 Tab 切换实现说明

参考文件：`apps/web-ele/src/views/claim/index.vue`

## 一、整体布局结构

报销页面由三层组件包裹构成主体布局：

```vue
<Page title="报销管理" description="..." :auto-content-height="true" v-loading="loading">
  <div class="flex h-full flex-col gap-2">
    <ElSegmented v-model="activeTab" :options="segmentedOptions" />
    <!-- 用户信息 -->
    <p v-if="userInfo" class="text-sm text-muted-foreground">...</p>
    <!-- 表格 -->
    <BasicTable :table-title="activeTableTitle" class="min-h-0 flex-1">...</BasicTable>
  </div>
</Page>
```

| 组件 | 来源 | 作用 |
| --- | --- | --- |
| `Page` | `@vben/common-ui` | 页面外壳，提供标题、描述、自动内容高度、`v-loading` 遮罩 |
| `ElSegmented` | `element-plus` | 分段控制器，作为 Tab 切换的载体 |
| `BasicTable` | `useVbenVxeGrid` (`#/adapter/vxe-table`) | vxe-grid 封装表格，承载各 Tab 的数据展示 |

外层 `div` 使用 `flex h-full flex-col gap-2`，让分段控制器固定在顶部，表格通过 `min-h-0 flex-1` 占满剩余空间并自适应高度。

## 二、Tab 切换的核心实现

### 1. Tab 状态定义

```ts
type TabKey = 'history' | 'my' | 'pending' | 'records';
const activeTab = ref<TabKey>('my');
```

四个 Tab 分别对应：
- `my` 我的报销
- `history` 历史记录
- `pending` 待我审批
- `records` 审批记录

### 2. 分段控制器选项

```ts
const segmentedOptions = computed(() => [
  { label: '我的报销', value: 'my' },
  { label: '历史记录', value: 'history' },
  { label: '待我审批', value: 'pending' },
  { label: '审批记录', value: 'records' },
]);
```

`ElSegmented` 通过 `v-model` 双向绑定 `activeTab`，点击任一分段即更新当前 Tab。

### 3. 标题动态计算

通过 `computed` 根据当前 Tab 拼接数量标题：

```ts
const myClaimsTitle = computed(() => `我的报销（${myClaims.value.length} 条）`);
// ...
const activeTableTitle = computed(() => {
  const titles: Record<TabKey, string> = { ... };
  return titles[activeTab.value];
});
```

表格的 `:table-title="activeTableTitle"` 会随 Tab 切换自动更新。

## 三、不同 Tab 的数据与列配置

### 1. 各 Tab 独立数据源

```ts
const myClaims = ref<ClaimApi.ClaimResponse[]>([]);
const myHistory = ref<ClaimApi.ClaimResponse[]>([]);
const pendingApprovals = ref<ClaimApi.ClaimResponse[]>([]);
const approvalRecords = ref<ClaimApi.ClaimApprovalRecord[]>([]);

function dataFor(tab: TabKey) {
  switch (tab) {
    case 'history': return myHistory.value;
    case 'my':      return myClaims.value;
    case 'pending': return pendingApprovals.value;
    case 'records': return approvalRecords.value;
  }
}
```

### 2. 各 Tab 独立列配置

```ts
const tabColumns: Record<TabKey, VxeGridProps['columns']> = {
  history:  [...],
  my:       [...],
  pending:  [...],
  records:  [...],
};
```

每个 Tab 对应的列字段、插槽、宽度都不相同（如 `pending` 多出操作列，`records` 多出操作类型列）。

## 四、切换时的联动刷新

### 1. 监听 Tab 变化

```ts
watch(activeTab, () => {
  reloadActiveTab();
});
```

### 2. 按需重载当前 Tab 数据

```ts
async function reloadActiveTab() {
  loading.value = true;
  try {
    switch (activeTab.value) {
      case 'history':  await loadMyHistory();          break;
      case 'my':       await loadMyClaims();           break;
      case 'pending':  await loadPendingApprovals();   break;
      case 'records':  await loadApprovalRecords();    break;
    }
  } finally {
    loading.value = false;
  }
  refreshTable();
}
```

切换 Tab 时只重新请求当前 Tab 对应的接口，避免全量刷新。

### 3. 刷新表格列与数据

```ts
function refreshTable() {
  tableApi.setGridOptions({
    columns: tabColumns[activeTab.value],
    data: dataFor(activeTab.value),
  });
}
```

通过 `tableApi.setGridOptions` 动态替换表格的列定义与数据，实现同一表格实例复用展示不同 Tab 的内容。

## 五、工具栏与操作按钮

```ts
const sharedToolbarConfig: VxeGridProps['toolbarConfig'] = {
  custom: true,
  tools: [{ code: 'manual-refresh', icon: 'vxe-icon-refresh', circle: true, name: '刷新' }],
};

// 表格实例
const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions: {
    id: 'claim-index',
    rowConfig: { keyField: 'id' },
    columns: tabColumns.my,
    proxyConfig: { enabled: false },
    height: 'auto',
    keepSource: true,
    toolbarConfig: sharedToolbarConfig,
  },
  gridEvents: {
    toolbarToolClick(event: { code: string }) {
      if (event.code === 'manual-refresh') reloadActiveTab();
    },
  },
});
```

- 关闭了内置 `proxyConfig`，全部数据由前端手动通过 `tableApi.setGridOptions` 注入。
- 工具栏右侧「新建报销申请」按钮通过 `#toolbar-tools` 插槽渲染，且仅在 `activeTab === 'my'` 时显示：

```vue
<template #toolbar-tools>
  <ElButton v-if="activeTab === 'my'" type="primary" @click="openCreateDrawer">
    新建报销申请
  </ElButton>
</template>
```

## 六、关键要点总结

1. **Tab 切换组件**：使用 `element-plus` 的 `ElSegmented`（分段控制器），相比传统 Tabs 视觉更紧凑。
2. **页面外壳**：使用 `@vben/common-ui` 的 `Page` 组件统一标题、描述与 loading。
3. **表格复用**：单实例 `BasicTable`（vxe-grid），通过 `tableApi.setGridOptions` 切换列与数据。
4. **数据按需加载**：`watch(activeTab)` 触发 `reloadActiveTab()`，仅请求当前 Tab 接口。
5. **插槽驱动渲染**：列定义使用 `slots`，在模板中通过 `#reason`、`#amount`、`#status`、`#action` 等插槽自定义单元格内容，部分插槽内根据 `activeTab` 做差异化展示。
