<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { CustomerApi } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import dayjs from 'dayjs';
import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElLink,
  ElMessage,
  ElMessageBox,
  ElTag,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteCustomerApi, getCustomersApi } from '#/api';

import CustomerDrawer from './components/CustomerDrawer.vue';
import { buildColumns, buildFormSchema, sharedToolbarConfig } from './data';

// ─── 数据 ───────────────────────────────────────────────────────────────────
const allCustomers = ref<CustomerApi.CustomerResponse[]>([]);
const selectedCustomer = ref<CustomerApi.CustomerResponse | null>(null);

function invalidateCustomers() {
  allCustomers.value = [];
}

// ─── 筛选表单 ───────────────────────────────────────────────────────────────
const formOptions: VbenFormProps = {
  schema: buildFormSchema(),
  commonConfig: {
    componentProps: { allowClear: true },
    labelWidth: 70,
  },
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  handleSubmit: async () => {
    const { formApi, reload } = tableApi;
    const formValues = await formApi.getValues();
    formApi.setLatestSubmissionValues(formValues);
    await reload(formValues);
  },
  handleReset: async () => {
    const { formApi, reload } = tableApi;
    await formApi.resetForm();
    const formValues = formApi.form.values;
    formApi.setLatestSubmissionValues(formValues);
    await reload(formValues);
  },
};

// ─── 表格 ───────────────────────────────────────────────────────────────────
const gridOptions: VxeGridProps<CustomerApi.CustomerResponse> = {
  columns: buildColumns(),
  customConfig: { storage: false },
  id: 'customers-list',
  keepSource: true,
  minHeight: 400,
  pagerConfig: {
    pageSize: 10,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues: any = {}) => {
        if (allCustomers.value.length === 0) {
          allCustomers.value = await getCustomersApi();
        }
        let list = [...allCustomers.value];
        if (formValues.keyword) {
          const kw = String(formValues.keyword).toLowerCase();
          list = list.filter(
            (c) =>
              c.name?.toLowerCase().includes(kw) ||
              c.address?.toLowerCase().includes(kw) ||
              c.phone?.toLowerCase().includes(kw) ||
              c.notes?.toLowerCase().includes(kw),
          );
        }
        const total = list.length;
        const start = (page.currentPage - 1) * page.pageSize;
        const items = list.slice(start, start + page.pageSize);
        return { items, total };
      },
    },
  },
  rowConfig: {
    isHover: true,
    keyField: 'id',
  },
  toolbarConfig: sharedToolbarConfig,
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
  gridEvents: {
    toolbarToolClick(event: { code: string }) {
      if (event.code === 'manual-refresh') refreshCustomers();
    },
    radioChange(params: { row: CustomerApi.CustomerResponse }) {
      selectedCustomer.value = params.row;
    },
    checkboxChange(params: { row: CustomerApi.CustomerResponse }) {
      selectedCustomer.value = params.row;
    },
    currentRowChange(params: { row: CustomerApi.CustomerResponse }) {
      if (params.row) selectedCustomer.value = params.row;
    },
  },
});

async function refreshCustomers() {
  invalidateCustomers();
  await tableApi.reload();
}

// ─── 抽屉：新建 / 编辑 ─────────────────────────────────────────────────────
const drawerVisible = ref(false);
const editingCustomer = ref<CustomerApi.CustomerResponse | null>(null);

function openCreateDrawer() {
  editingCustomer.value = null;
  drawerVisible.value = true;
}

function openEditDrawer(row: CustomerApi.CustomerResponse) {
  editingCustomer.value = row;
  drawerVisible.value = true;
}

async function handleDrawerSuccess() {
  invalidateCustomers();
  await tableApi.reload();
}

// ─── 删除 ───────────────────────────────────────────────────────────────────
async function handleDelete(row: CustomerApi.CustomerResponse) {
  try {
    await ElMessageBox.confirm(
      `确认删除客户「${row.name}」？该操作不可恢复。`,
      '删除客户',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    );
  } catch {
    return;
  }
  try {
    await deleteCustomerApi(row.id);
    ElMessage.success('客户已删除');
    if (selectedCustomer.value?.id === row.id) {
      selectedCustomer.value = null;
    }
    invalidateCustomers();
    await tableApi.reload();
  } catch (error: any) {
    console.error('删除失败:', error);
    ElMessage.error('删除失败');
  }
}

// ─── 行操作：在地图上定位 ───────────────────────────────────────────────────
function locateOnMap(row: CustomerApi.CustomerResponse) {
  selectedCustomer.value = row;
}

// ─── 地图 URL（Google Maps Embed API，按地址定位） ──────────────────────────
// 与 OA-System employee_customers.html 一致：q 优先用地址，缺省回退经纬度，再回退名称
const GOOGLE_MAPS_API_KEY = (
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
).trim();
const DEFAULT_PLACE = 'Hong Kong';

function buildPlaceQuery(c: CustomerApi.CustomerResponse | null): string {
  if (!c) return DEFAULT_PLACE;
  const address = (c.address ?? '').trim();
  if (address) return address;
  if (Number.isFinite(c.latitude) && Number.isFinite(c.longitude)) {
    return `${c.latitude},${c.longitude}`;
  }
  return (c.name ?? '').trim() || DEFAULT_PLACE;
}

const mapIframeUrl = computed(() => {
  const key = GOOGLE_MAPS_API_KEY;
  const place = buildPlaceQuery(selectedCustomer.value);
  if (!key) return '';
  const params = new URLSearchParams({ key, q: place, zoom: '15' });
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
});

const externalMapUrl = computed(() => {
  const c = selectedCustomer.value;
  if (!c) return '';
  const place = buildPlaceQuery(c);
  return `https://www.google.com/maps?q=${encodeURIComponent(place)}`;
});

function formatTime(v: null | string) {
  return v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-';
}

// ─── 初始化 ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    allCustomers.value = await getCustomersApi();
    if (allCustomers.value.length > 0) {
      selectedCustomer.value = allCustomers.value[0] ?? null;
    }
  } catch (error) {
    console.error('[fuximap] 初始化失败:', error);
  }
});
</script>

<template>
  <Page title="客户地图管理" description="客户信息维护与地理位置可视化">
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <!-- 左：客户列表（筛选 + 表格） -->
        <div class="xl:col-span-3">
          <BasicTable table-title="客户列表">
            <template #toolbar-tools>
              <ElButton type="primary" @click="openCreateDrawer">
                新增客户
              </ElButton>
            </template>

            <template #coords="{ row }">
              <div class="font-mono text-xs">
                <div>
                  <span class="text-muted-foreground">东经</span>
                  {{ row.longitude?.toFixed?.(6) ?? row.longitude }}
                </div>
                <div>
                  <span class="text-muted-foreground">北纬</span>
                  {{ row.latitude?.toFixed?.(6) ?? row.latitude }}
                </div>
              </div>
            </template>

            <template #contacts_summary="{ row }">
              <div v-if="row.contacts?.length" class="flex flex-col gap-1">
                <div
                  v-for="(c, i) in row.contacts"
                  :key="i"
                  class="text-xs leading-tight"
                >
                  <ElTag
                    v-if="c.role"
                    class="mr-1 align-middle"
                    size="small"
                    type="info"
                  >
                    {{ c.role }}
                  </ElTag>
                  <span class="align-middle">{{ c.name || '-' }}</span>
                  <span
                    v-if="c.phone"
                    class="ml-1 align-middle text-muted-foreground"
                  >
                    / {{ c.phone }}
                  </span>
                  <span
                    v-if="c.email"
                    class="ml-1 block truncate align-middle text-muted-foreground md:inline"
                  >
                    {{ c.email }}
                  </span>
                </div>
              </div>
              <span v-else class="text-muted-foreground">-</span>
            </template>

            <template #created_at="{ row }">
              <span class="text-xs text-muted-foreground">
                {{ formatTime(row.created_at) }}
              </span>
            </template>

            <template #action="{ row }">
              <ElButton size="small" type="primary" @click="locateOnMap(row)">
                定位
              </ElButton>
              <ElButton size="small" @click="openEditDrawer(row)">
                编辑
              </ElButton>
              <ElButton size="small" type="danger" @click="handleDelete(row)">
                删除
              </ElButton>
            </template>
          </BasicTable>
        </div>

        <!-- 右：地图 + 详情卡片 -->
        <div class="flex flex-col gap-4 xl:col-span-2">
          <!-- 地图面板 -->
          <section
            class="flex h-[420px] flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <header
              class="flex items-center justify-between border-b px-4 py-2.5"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold">地图</span>
                <ElTag size="small" v-if="selectedCustomer">
                  {{ selectedCustomer.name }}
                </ElTag>
                <span v-else class="text-xs text-muted-foreground">
                  点击「定位」或选择行以聚焦
                </span>
              </div>
              <ElLink
                v-if="externalMapUrl"
                :href="externalMapUrl"
                target="_blank"
                type="primary"
                :underline="false"
              >
                打开大图 ↗
              </ElLink>
            </header>
            <div class="relative flex-1 bg-muted">
              <iframe
                v-if="mapIframeUrl"
                :src="mapIframeUrl"
                class="h-full w-full border-0"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                title="Google Map"
                allowfullscreen
              ></iframe>
              <div
                v-else
                class="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground"
              >
                未配置 VITE_GOOGLE_MAPS_API_KEY，无法加载 Google 地图
              </div>
            </div>
          </section>

          <!-- 详情面板 -->
          <section
            class="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
          >
            <header class="mb-3 flex items-center justify-between">
              <h3 class="text-sm font-semibold text-muted-foreground">
                客户详情
              </h3>
              <div class="flex gap-1" v-if="selectedCustomer">
                <ElButton
                  size="small"
                  type="primary"
                  @click="openEditDrawer(selectedCustomer)"
                >
                  编辑
                </ElButton>
                <ElButton
                  size="small"
                  type="danger"
                  @click="handleDelete(selectedCustomer)"
                >
                  删除
                </ElButton>
              </div>
            </header>

            <ElDescriptions
              v-if="selectedCustomer"
              :column="1"
              border
              size="small"
            >
              <ElDescriptionsItem label="客户名称">
                <span class="font-medium">{{ selectedCustomer.name }}</span>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="地址">
                {{ selectedCustomer.address }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="经纬度">
                <span class="font-mono text-xs">
                  {{
                    selectedCustomer.longitude?.toFixed?.(6) ??
                    selectedCustomer.longitude
                  }},
                  {{
                    selectedCustomer.latitude?.toFixed?.(6) ??
                    selectedCustomer.latitude
                  }}
                </span>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="电话">
                {{ selectedCustomer.phone || '-' }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="备注">
                <span class="whitespace-pre-wrap text-sm">
                  {{ selectedCustomer.notes || '-' }}
                </span>
              </ElDescriptionsItem>
              <ElDescriptionsItem
                :label="`联系人 (${selectedCustomer.contacts?.length ?? 0})`"
              >
                <div v-if="selectedCustomer.contacts?.length" class="space-y-2">
                  <div
                    v-for="(c, i) in selectedCustomer.contacts"
                    :key="i"
                    class="rounded-md border bg-muted/30 p-2 text-xs"
                  >
                    <div class="mb-1">
                      <ElTag v-if="c.role" size="small" type="info">
                        {{ c.role }}
                      </ElTag>
                      <span class="ml-1 font-medium">{{ c.name || '-' }}</span>
                    </div>
                    <div>
                      <span class="text-muted-foreground">电话：</span>
                      {{ c.phone || '-' }}
                    </div>
                    <div>
                      <span class="text-muted-foreground">邮箱：</span>
                      {{ c.email || '-' }}
                    </div>
                  </div>
                </div>
                <span v-else class="text-muted-foreground">暂无联系人</span>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="创建时间">
                {{ formatTime(selectedCustomer.created_at) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="更新时间">
                {{ formatTime(selectedCustomer.updated_at) }}
              </ElDescriptionsItem>
            </ElDescriptions>

            <ElEmpty v-else description="暂无选中客户" class="py-10" />
          </section>
        </div>
      </div>
    </div>

    <!-- 新增/编辑 抽屉 -->
    <CustomerDrawer
      v-model:visible="drawerVisible"
      :editing="editingCustomer"
      @success="handleDrawerSuccess"
    />
  </Page>
</template>
