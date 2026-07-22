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

function handlePageChange(page: number) {
  emit('update:page', page);
}

function handlePageSizeChange(pageSize: number) {
  emit('update:pageSize', pageSize);
}

function handleAdd() {
  emit('add');
}

function handleRefresh() {
  emit('refresh');
}
</script>

<template>
  <div class="base-table-wrapper">
    <div class="table-toolbar" v-if="showAdd || showRefresh">
      <ElButton type="primary" icon="Plus" @click="handleAdd" v-if="showAdd">
        {{ addText }}
      </ElButton>
      <ElButton icon="RefreshCw" @click="handleRefresh" v-if="showRefresh">
        {{ refreshText }}
      </ElButton>
    </div>
    <ElTable
      :data="data"
      :loading="loading"
      :size="size"
      border
      stripe
      v-loading="loading"
    >
      <ElTableColumn
        v-for="column in columns"
        :key="column.prop || column.label"
        v-bind="column"
      />
    </ElTable>
    <div class="pagination-wrapper" v-if="total > 0">
      <ElPagination
        :current-page="currentPage"
        :page-size="currentPageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.base-table-wrapper {
  width: 100%;
}

.table-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
