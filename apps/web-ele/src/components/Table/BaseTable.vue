<script lang="ts" setup>
import type { TableProps } from 'element-plus';

import { ref, watch } from 'vue';

import { ElButton, ElPagination, ElTable, ElTableColumn } from 'element-plus';

interface ColumnConfig {
  prop: string;
  label: string;
  width?: number | string;
  align?: 'center' | 'left' | 'right';
  formatter?: (row: any, column: any, cellValue: any, index: number) => any;
  [key: string]: any;
}

interface Props {
  data: any[];
  columns: ColumnConfig[];
  total: number;
  page?: number;
  pageSize?: number;
  loading?: boolean;
  showAdd?: boolean;
  addText?: string;
  showRefresh?: boolean;
  refreshText?: string;
  size?: TableProps['size'];
}

interface Emits {
  'update:page': [value: number];
  'update:pageSize': [value: number];
  add: [];
  refresh: [];
}

const props = withDefaults(defineProps<Props>(), {
  page: 1,
  pageSize: 10,
  loading: false,
  showAdd: false,
  addText: '新增',
  showRefresh: false,
  refreshText: '刷新',
  size: 'default',
});

const emit = defineEmits<Emits>();

const currentPage = ref(props.page);
const currentPageSize = ref(props.pageSize);

watch(
  () => props.page,
  (val) => {
    currentPage.value = val;
  },
);

watch(
  () => props.pageSize,
  (val) => {
    currentPageSize.value = val;
  },
);

function handlePageChange(val: number) {
  currentPage.value = val;
  emit('update:page', val);
}

function handlePageSizeChange(val: number) {
  currentPageSize.value = val;
  emit('update:pageSize', val);
}
</script>

<template>
  <div class="base-table-container">
    <div class="table-header" v-if="showAdd || showRefresh">
      <span></span>
      <div class="header-actions">
        <ElButton v-if="showRefresh" type="primary" @click="emit('refresh')">
          {{ refreshText }}
        </ElButton>
        <ElButton v-if="showAdd" type="success" @click="emit('add')">
          {{ addText }}
        </ElButton>
      </div>
    </div>
    <ElTable
      :data="data"
      :loading="loading"
      :size="size"
      border
      stripe
      style="width: 100%"
    >
      <ElTableColumn
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :align="column.align || 'left'"
      >
        <template #default="{ row, $index }">
          <template v-if="column.formatter">
            {{ column.formatter(row, column, row[column.prop], $index) }}
          </template>
          <template v-else>
            {{ row[column.prop] }}
          </template>
        </template>
      </ElTableColumn>
    </ElTable>
    <div class="pagination-container">
      <ElPagination
        :current-page="currentPage"
        :page-size="currentPageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.base-table-container {
  padding: 16px;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
EOF; __tr_native_ec=$?; pwd -P >|
'/var/folders/3b/lwjkgqhx3419yhxy4r241tpc0000gn/T/agent-toolhost/jobs/job-52ce314c59724eff9e9965c9650ad620/cwd.txt';
exit "$__tr_native_ec"
